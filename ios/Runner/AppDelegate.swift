import AVFoundation
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  private let channelName = "pomagai.local_storage"
  private let speechChannelName = "slovoigra/speech"
  private let speechSynthesizer = AVSpeechSynthesizer()

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions:
      [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    guard let controller = window?.rootViewController as? FlutterViewController
    else {
      return super.application(
        application,
        didFinishLaunchingWithOptions: launchOptions
      )
    }
    let channel = FlutterMethodChannel(
      name: channelName,
      binaryMessenger: controller.binaryMessenger
    )
    let defaults = UserDefaults.standard
    channel.setMethodCallHandler { call, result in
      guard
        let arguments = call.arguments as? [String: Any],
        let key = arguments["key"] as? String,
        !key.isEmpty
      else {
        result(
          FlutterError(
            code: "invalid_key",
            message: "Storage key is required.",
            details: nil
          )
        )
        return
      }
      switch call.method {
      case "read":
        result(defaults.string(forKey: key))
      case "write":
        guard let value = arguments["value"] as? String else {
          result(
            FlutterError(
              code: "invalid_value",
              message: "Storage value is required.",
              details: nil
            )
          )
          return
        }
        defaults.set(value, forKey: key)
        result(nil)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
    let speechChannel = FlutterMethodChannel(
      name: speechChannelName,
      binaryMessenger: controller.binaryMessenger
    )
    speechChannel.setMethodCallHandler { [weak self] call, result in
      guard let self else {
        result(
          FlutterError(
            code: "speech_unavailable",
            message: "Govorni servis nije dostupan.",
            details: nil
          )
        )
        return
      }
      switch call.method {
      case "speak":
        guard
          let arguments = call.arguments as? [String: Any],
          let text = arguments["text"] as? String,
          !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
          result(
            FlutterError(
              code: "invalid_text",
              message: "Tekst za izgovor je prazan.",
              details: nil
            )
          )
          return
        }
        guard let voice = AVSpeechSynthesisVoice(language: "sr-RS") else {
          result(
            FlutterError(
              code: "serbian_voice_unavailable",
              message: "Srpski glas nije instaliran na uređaju.",
              details: nil
            )
          )
          return
        }
        self.speechSynthesizer.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = voice
        utterance.rate = 0.42
        utterance.pitchMultiplier = 1.08
        self.speechSynthesizer.speak(utterance)
        result([
          "spoken": true,
          "locale": "sr-RS",
          "message": "Izgovor je pokrenut.",
        ])
      case "stop":
        self.speechSynthesizer.stopSpeaking(at: .immediate)
        result(nil)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
    return super.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )
  }
}
