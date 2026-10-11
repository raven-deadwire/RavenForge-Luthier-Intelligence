// Homepage evidence only: unmodified release-equivalent JUCE editor and presets.
// This harness does not alter production code or modify screenshot pixels.
#include "PluginEditor.h"
#include "GuitarSignaturePresets.h"
#include <iostream>
#include <memory>
#include <stdexcept>

static void require(bool value, const char* message) {
    if (!value) throw std::runtime_error(message);
}
static juce::Component* find(juce::Component& root, const juce::String& id) {
    if (root.getComponentID() == id) return &root;
    for (auto* child : root.getChildren()) if (auto* match = find(*child, id)) return match;
    return nullptr;
}
static juce::ComboBox* presetPicker(juce::Component& root) {
    if (auto* combo = dynamic_cast<juce::ComboBox*>(&root); combo && combo->getName() == "Preset") return combo;
    for (auto* child : root.getChildren()) if (auto* match = presetPicker(*child)) return match;
    return nullptr;
}
static void capture(const juce::File& directory, int index, const char* name) {
    auto processor = std::make_unique<ChimeraProcessor>();
    processor->loadFactoryPreset(index);
    processor->prepareToPlay(48000, 256);
    auto editor = std::make_unique<ChimeraEditor>(*processor);
    editor->setSize(1180, 780);
    auto* picker = presetPicker(*editor);
    require(picker != nullptr, "Missing native preset picker");
    picker->setSelectedId(index + 1, juce::sendNotificationSync);
    auto* toggle = dynamic_cast<juce::TextButton*>(find(*editor, "cabRigControls"));
    require(toggle != nullptr, "Missing native RIG CONTROLS button");
    if (toggle->isVisible() && toggle->getButtonText() == "RIG CONTROLS" && toggle->onClick) toggle->onClick();
    juce::AudioBuffer<float> buffer(2, 256);
    juce::MidiBuffer midi;
    for (int i=0; i<80; ++i) {
        buffer.clear();
        processor->processBlock(buffer, midi);
        juce::Thread::sleep(5);
        juce::Timer::callPendingTimersSynchronously();
    }
    editor->resized();
    const auto file = directory.getChildFile(juce::String(name) + ".png");
    auto output = file.createOutputStream();
    require(output && output->setPosition(0) && output->truncate().wasOk(), "Cannot write capture");
    const auto image = editor->createComponentSnapshot(editor->getLocalBounds());
    require(image.isValid() && juce::PNGImageFormat().writeImageToStream(image, *output), "Capture encoding failed");
    output->flush();
    std::cout << name << " | preset=" << spectralforge::selectablePresetName(index)
              << " | presetIndex=" << index << " | mode=" << processor->parameters().getRawParameterValue("mode")->load()
              << " | size=" << image.getWidth() << 'x' << image.getHeight() << '\n';
    const int selectedMode = static_cast<int>(processor->parameters().getRawParameterValue("mode")->load());
    std::cout << "  dualtype=" << processor->parameters().getRawParameterValue("dualtype")->load()
              << " | dualblend=" << processor->parameters().getRawParameterValue("dualblend")->load()
              << " | x1=" << processor->parameters().getRawParameterValue("x1")->load()
              << " | x2=" << processor->parameters().getRawParameterValue("x2")->load()
              << " | inputmode=" << processor->parameters().getRawParameterValue("inputmode")->load() << '\n';
    for (int lane = 0; lane < selectedMode + 1; ++lane) {
        const int model = processor->selectedAmpModel(lane);
        const int channel = processor->selectedAmpChannel(lane);
        const int route = processor->selectedAmpNativeRoute(lane);
        const auto& amp = spectralforge::ampInfo(model);
        const auto& panel = spectralforge::ampNativePanel(model);
        std::cout << "  lane=" << lane << " | model=" << model << " | name=" << amp.name
                  << " | reference=" << amp.reference << " | channel=" << panel.channels[static_cast<size_t>(channel)]
                  << " | route=" << (panel.routes.empty() ? "" : panel.routes[static_cast<size_t>(route)]) << '\n';
    }
    editor.reset();
    processor->releaseResources();
}
int main(int argc, char** argv) {
    std::cout << std::unitbuf;
    juce::ScopedJuceInitialiser_GUI gui;
    try {
        require(argc == 2, "Pass output directory");
        const juce::File directory(argv[1]);
        require(directory.createDirectory().wasOk(), "Cannot create capture directory");
        capture(directory, 7, "rigs-classic-crunch-beta13");
        capture(directory, 35, "rigs-dual-wrath-beta13");
        capture(directory, 31, "rigs-matrix-crom-cruach-beta13");
        return 0;
    } catch (const std::exception& error) {
        std::cerr << error.what() << '\n';
        return 1;
    }
}
