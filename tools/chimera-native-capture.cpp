// Website illustration evidence, separate from product acceptance tests.
// Links the unchanged product at the source pinned by the workflow.
#include "PluginEditor.h"
#include "GuitarSignaturePresets.h"
#include "ChimeraBuildVersion.h"
#include <algorithm>
#include <array>
#include <atomic>
#include <chrono>
#include <exception>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <thread>

namespace {
void require(bool value, const char* message) {
    if (!value) throw std::runtime_error(message);
}
void pump(int ms = 60) {
    juce::MessageManager::getInstance()->runDispatchLoopUntil(ms);
}
juce::Component* find(juce::Component& root, const juce::String& id) {
    if (root.getComponentID() == id) return &root;
    for (auto* child : root.getChildren()) if (auto* match = find(*child, id)) return match;
    return nullptr;
}
juce::ComboBox* presetPicker(juce::Component& root) {
    if (auto* combo = dynamic_cast<juce::ComboBox*>(&root); combo && combo->getName() == "Preset") return combo;
    for (auto* child : root.getChildren()) if (auto* match = presetPicker(*child)) return match;
    return nullptr;
}
juce::TextButton* button(juce::Component& root, const juce::String& label) {
    if (auto* item = dynamic_cast<juce::TextButton*>(&root); item && item->getButtonText() == label) return item;
    for (auto* child : root.getChildren()) if (auto* match = button(*child, label)) return match;
    return nullptr;
}
void nativePeer(juce::Component& component) {
    require(juce::Desktop::getInstance().getDisplays().getPrimaryDisplay() != nullptr,
            "A real native display is required; software-only output is not accepted");
    require(component.isOnDesktop() && component.isShowing() && component.getPeer()
            && component.getPeer()->getNativeHandle(), "Visible native component peer required");
}
void writeBytes(const juce::File& file, const void* data, size_t size) {
    auto stream = file.createOutputStream();
    require(stream && stream->setPosition(0) && stream->truncate().wasOk(), "Cannot prepare output file");
    const bool complete = stream->write(data, size);
    stream->flush();
    require(complete && stream->getStatus().wasOk() && file.getSize() == juce::int64(size),
            "Output write was incomplete");
}
float raw(ChimeraProcessor& processor, const char* id) {
    auto* parameter = processor.parameters().getRawParameterValue(id);
    require(parameter != nullptr, "Required route parameter missing");
    return parameter->load();
}
// A fixed interval, selected before measuring; never wait for a desired CPU value.
// Product peak decay depends on processed audio seconds, not idle wall time.
constexpr int warmupBlocks = 2250; // 12 seconds at 48 kHz / 256 samples.
juce::var settleAudio(ChimeraProcessor& processor) {
    using Clock = std::chrono::steady_clock;
    const auto period = std::chrono::duration_cast<Clock::duration>(std::chrono::duration<double>(256.0 / 48000.0));
    const auto initialAverage = processor.cpuLoad(), initialPeak = processor.cpuPeakLoad();
    std::atomic<bool> finished{false};
    std::exception_ptr failure;
    int processed = 0, overruns = 0;
    double wallSeconds = 0.0, maxCallbackMs = 0.0;
    std::thread audio([&] {
        try {
            juce::Thread::setCurrentThreadName("ChimeraWebsiteAudio");
            juce::AudioBuffer<float> buffer(2, 256);
            juce::MidiBuffer midi;
            const auto started = Clock::now();
            auto deadline = started;
            for (int block = 0; block < warmupBlocks; ++block) {
                buffer.clear();
                const auto callbackStarted = Clock::now();
                processor.processBlock(buffer, midi);
                const auto callbackEnded = Clock::now();
                maxCallbackMs = std::max(maxCallbackMs,
                    std::chrono::duration<double, std::milli>(callbackEnded - callbackStarted).count());
                ++processed;
                deadline += period;
                if (callbackEnded > deadline) {
                    ++overruns;
                    deadline = callbackEnded; // Do not issue a burst of catch-up callbacks.
                }
                std::this_thread::sleep_until(deadline);
            }
            wallSeconds = std::chrono::duration<double>(Clock::now() - started).count();
        } catch (...) {
            failure = std::current_exception();
        }
        finished.store(true, std::memory_order_release);
    });
    try {
        while (!finished.load(std::memory_order_acquire)) pump(10);
    } catch (...) {
        audio.join();
        throw;
    }
    audio.join();
    if (failure) std::rethrow_exception(failure);
    require(processed == warmupBlocks, "Incomplete fixed audio settling interval");
    auto* stats = new juce::DynamicObject();
    stats->setProperty("policy", "fixed 2250 paced callbacks; no CPU threshold, reset or retry");
    stats->setProperty("audio_thread", true);
    stats->setProperty("blocks", processed);
    stats->setProperty("processed_audio_seconds", double(processed) * 256.0 / 48000.0);
    stats->setProperty("wall_seconds", wallSeconds);
    stats->setProperty("callback_deadline_overruns", overruns);
    stats->setProperty("maximum_callback_ms", maxCallbackMs);
    stats->setProperty("initial_cpu_average_percent", initialAverage);
    stats->setProperty("initial_cpu_peak_percent", initialPeak);
    stats->setProperty("final_cpu_average_percent", processor.cpuLoad());
    stats->setProperty("final_cpu_peak_percent", processor.cpuPeakLoad());
    std::cout << "Fixed audio settling: blocks=" << processed << " | wall_seconds=" << wallSeconds
              << " | deadline_overruns=" << overruns << " | max_callback_ms=" << maxCallbackMs
              << " | actual_cpu=" << processor.cpuLoad() << " | actual_peak=" << processor.cpuPeakLoad() << '\n';
    return juce::var(stats);
}
struct Scene {
    int preset, mode;
    const char* name;
    const char* file;
    std::array<int, 3> models;
};
juce::var capture(const juce::File& directory, const Scene& scene) {
    auto processor = std::make_unique<ChimeraProcessor>();
    processor->prepareToPlay(48000, 256);
    auto editor = std::make_unique<ChimeraEditor>(*processor);
    editor->setSize(1180, 780);
    editor->addToDesktop(juce::ComponentPeer::windowIsTemporary);
    editor->setVisible(true);
    pump();
    nativePeer(*editor);
    auto* picker = presetPicker(*editor);
    require(picker != nullptr, "Missing actual preset ComboBox");
    // Select the real product preset through its existing UI callback.
    picker->setSelectedId(scene.preset + 1, juce::sendNotificationSync);
    pump();
    require(picker->getSelectedId() == scene.preset + 1 && picker->getText() == scene.name,
            "The requested preset is not displayed");
    require(juce::String(spectralforge::selectablePresetName(scene.preset)) == scene.name,
            "Preset identity changed");
    auto* rigs = button(*editor, "RIGS");
    require(rigs != nullptr && bool(rigs->onClick), "Missing native RIGS navigation");
    rigs->triggerClick();
    pump();
    auto* toggle = dynamic_cast<juce::TextButton*>(find(*editor, "cabRigControls"));
    require(toggle != nullptr, "Missing native RIG CONTROLS button");
    if (toggle->isVisible() && toggle->getButtonText() == "RIG CONTROLS") {
        require(bool(toggle->onClick), "RIG CONTROLS action missing");
        toggle->triggerClick();
        pump();
    }
    require(int(raw(*processor, "mode")) == scene.mode, "Preset restored the wrong routing mode");
    if (scene.mode != 0) require(toggle->isShowing() && toggle->getButtonText() == "CABINET ROOM",
                                 "The native rig-controls view did not open");
    const auto audioSettling = settleAudio(*processor);
    pump();
    nativePeer(*editor);
    require(editor->getWidth() == 1180 && editor->getHeight() == 780, "Editor dimensions changed");
    require(picker->getSelectedId() == scene.preset + 1, "Preset selection became custom during capture");
    auto* item = new juce::DynamicObject();
    item->setProperty("file", scene.file);
    item->setProperty("preset", scene.name);
    item->setProperty("preset_index", scene.preset);
    item->setProperty("mode", scene.mode);
    item->setProperty("native_peer", true);
    item->setProperty("width", editor->getWidth());
    item->setProperty("height", editor->getHeight());
    item->setProperty("pixel_edits", false);
    item->setProperty("audio_settling", audioSettling);
    item->setProperty("input_mode", raw(*processor, "inputmode"));
    item->setProperty("dual_type", raw(*processor, "dualtype"));
    item->setProperty("dual_blend", raw(*processor, "dualblend"));
    item->setProperty("x1_hz", raw(*processor, "x1"));
    item->setProperty("x2_hz", raw(*processor, "x2"));
    juce::Array<juce::var> amps;
    for (int lane = 0; lane <= scene.mode; ++lane) {
        const int model = processor->selectedAmpModel(lane);
        require(model == scene.models[size_t(lane)], "Preset did not restore the expected commercial amp");
        auto* amp = new juce::DynamicObject();
        amp->setProperty("lane", lane);
        amp->setProperty("model_index", model);
        amp->setProperty("name", spectralforge::ampInfo(model).name);
        amp->setProperty("channel_index", processor->selectedAmpChannel(lane));
        amp->setProperty("input_route_index", processor->selectedAmpNativeRoute(lane));
        amps.add(juce::var(amp));
    }
    item->setProperty("amps", amps);
    const auto image = editor->createComponentSnapshot(editor->getLocalBounds());
    require(image.isValid() && image.getWidth() == 1180 && image.getHeight() == 780,
            "Native editor snapshot dimensions are wrong");
    juce::MemoryOutputStream encoded;
    require(juce::PNGImageFormat().writeImageToStream(image, encoded), "PNG encoding failed");
    writeBytes(directory.getChildFile(scene.file), encoded.getData(), encoded.getDataSize());
    std::cout << scene.file << " | native_peer=1 | preset=" << scene.name
              << " | preset_index=" << scene.preset << " | mode=" << scene.mode
              << " | size=1180x780\n";
    editor.reset();
    pump();
    processor->releaseResources();
    return juce::var(item);
}
}

int main(int argc, char** argv) {
    std::cout << std::unitbuf;
    juce::ScopedJuceInitialiser_GUI gui;
    try {
        require(argc == 2, "Usage: ChimeraWebsiteCapture output-directory");
        require(juce::String(CHIMERA_PRODUCT_VERSION) == "1.3.1"
                && juce::String(CHIMERA_PREVIEW_VERSION) == "1.3.1-beta.1", "Wrong compiled product version");
        const juce::File directory(argv[1]);
        require(directory.createDirectory().wasOk(), "Cannot create evidence directory");
        juce::Array<juce::var> images;
        for (const Scene scene : std::array<Scene, 3>{{
                 {7, 0, "Classic Crunch", "rigs-classic-crunch-beta131.png", {1, -1, -1}},
                 {35, 1, "Feel My Wrath", "rigs-dual-wrath-beta131.png", {17, 2, -1}},
                 {31, 2, "Crom Cruach", "rigs-matrix-crom-cruach-beta131.png", {14, 7, 2}}
             }}) images.add(capture(directory, scene));
        auto* report = new juce::DynamicObject();
        report->setProperty("schema", 1);
        report->setProperty("product_version", CHIMERA_PRODUCT_VERSION);
        report->setProperty("release_version", CHIMERA_PREVIEW_VERSION);
        report->setProperty("captured_at_utc", juce::Time::getCurrentTime().toISO8601(true));
        report->setProperty("capture_kind", "Native Linux JUCE editor component snapshots; not a desktop framebuffer capture, DAW session or product acceptance test");
        report->setProperty("sample_rate", 48000);
        report->setProperty("block_size", 256);
        report->setProperty("audio_input", "silence; fixed 2250 paced callbacks per preset (12 seconds of audio); separate worker with UI dispatch; no audio interface or real-time driver");
        report->setProperty("parameter_overrides", juce::Array<juce::var>{});
        report->setProperty("images", images);
        const auto json = juce::JSON::toString(juce::var(report));
        writeBytes(directory.getChildFile("capture-observations.json"), json.toRawUTF8(), json.getNumBytesAsUTF8());
        std::cout << "Captured three native product views; product acceptance remains separate.\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Capture failed: " << error.what() << '\n';
        return 1;
    }
}
