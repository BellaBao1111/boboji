import UIKit
import Capacitor

/// 应用内自定义插件在这里注册（Main.storyboard 的根控制器指向本类）
class NativeBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GameCenterPlugin())
        bridge?.registerPluginInstance(AppReviewPlugin())
    }
}
