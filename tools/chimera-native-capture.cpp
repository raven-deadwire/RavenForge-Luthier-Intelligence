// Website illustration evidence, separate from product acceptance tests.
// Links the unchanged product at the source pinned by the workflow.
#include "PluginEditor.h"
#include "GuitarSignaturePresets.h"
#include "ChimeraBuildVersion.h"
#include <array>
#include <iostream>
#include <memory>
#include <stdexcept>

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
    juce::AudioBuffer<float> buffer(2, 256);
    juce::MidiBuffer midi;
    for (int block = 0; block < 80; ++block) {
        buffer.clear();
        processor->processBlock(buffer, midi);
        pump(5);
    }
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
        report->setProperty("audio_input", "silence; 80 blocks per preset; no audio interface");
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
