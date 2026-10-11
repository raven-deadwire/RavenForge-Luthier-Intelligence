# Add a website-only executable after the untouched product has declared its
# JUCE libraries. Pass this through CMAKE_PROJECT_ChimeraAmpMatrix_INCLUDE.
function(chimera_add_website_capture)
  if(NOT EXISTS "${CHIMERA_WEBSITE_CAPTURE_SOURCE}")
    message(FATAL_ERROR "CHIMERA_WEBSITE_CAPTURE_SOURCE must name the external harness")
  endif()
  juce_add_console_app(ChimeraWebsiteCapture PRODUCT_NAME "Chimera Website Capture")
  target_sources(ChimeraWebsiteCapture PRIVATE "${CHIMERA_WEBSITE_CAPTURE_SOURCE}")
  target_include_directories(ChimeraWebsiteCapture PRIVATE "${CMAKE_CURRENT_SOURCE_DIR}/Source")
  target_compile_definitions(ChimeraWebsiteCapture PRIVATE JUCE_MODAL_LOOPS_PERMITTED=1)
  target_link_libraries(ChimeraWebsiteCapture PRIVATE
    ChimeraAmpMatrix ChimeraArtwork ChimeraManual
    juce::juce_cryptography juce::juce_audio_utils juce::juce_dsp)
  file(GENERATE OUTPUT "${CMAKE_BINARY_DIR}/chimera-capture-binary-$<CONFIG>.txt"
       CONTENT "$<TARGET_FILE:ChimeraWebsiteCapture>\n")
endfunction()

cmake_language(DEFER CALL chimera_add_website_capture)
