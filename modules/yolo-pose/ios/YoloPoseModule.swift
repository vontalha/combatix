import ExpoModulesCore

public class YoloPoseModule: Module {
  public func definition() -> ModuleDefinition {
    Name("YoloPose")

    View(YoloPoseView.self) {
      Events("onResult")
    }
  }
}
