import Foundation
import Capacitor
import GameKit

/**
 * Game Center 薄插件（零外部依赖，GameKit 系统框架）。
 * JS 侧通过 window.Capacitor.Plugins.GameCenter 调用；网页环境由 src/native.ts 静默降级。
 */
@objc(GameCenterPlugin)
public class GameCenterPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "GameCenterPlugin"
    public let jsName = "GameCenter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "unlockAchievement", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showLeaderboards", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "showAchievements", returnType: CAPPluginReturnPromise),
    ]

    /// 登录 Game Center。首次会由系统弹出登录/欢迎横幅；authenticateHandler 可能被系统多次回调，只 resolve 一次。
    @objc func authenticate(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            var resolved = false
            GKLocalPlayer.local.authenticateHandler = { [weak self] viewController, error in
                if let vc = viewController {
                    self?.bridge?.viewController?.present(vc, animated: true)
                    return
                }
                guard !resolved else { return }
                resolved = true
                if let error = error {
                    call.resolve(["authenticated": false, "error": error.localizedDescription])
                } else {
                    call.resolve(["authenticated": GKLocalPlayer.local.isAuthenticated])
                }
            }
        }
    }

    /// 上报排行榜分数（未登录时静默成功，不打扰游戏流程）
    @objc func submitScore(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated,
              let leaderboardId = call.getString("leaderboardId"),
              let value = call.getInt("value") else {
            call.resolve()
            return
        }
        GKLeaderboard.submitScore(value, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [leaderboardId]) { _ in
            call.resolve()
        }
    }

    /// 解锁成就（100%），带系统完成横幅
    @objc func unlockAchievement(_ call: CAPPluginCall) {
        guard GKLocalPlayer.local.isAuthenticated,
              let achievementId = call.getString("achievementId") else {
            call.resolve()
            return
        }
        let achievement = GKAchievement(identifier: achievementId)
        achievement.percentComplete = 100
        achievement.showsCompletionBanner = true
        GKAchievement.report([achievement]) { _ in
            call.resolve()
        }
    }

    @objc func showLeaderboards(_ call: CAPPluginCall) {
        presentGameCenter(state: .leaderboards, call: call)
    }

    @objc func showAchievements(_ call: CAPPluginCall) {
        presentGameCenter(state: .achievements, call: call)
    }

    private func presentGameCenter(state: GKGameCenterViewControllerState, call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard GKLocalPlayer.local.isAuthenticated else {
                call.resolve(["shown": false])
                return
            }
            let vc = GKGameCenterViewController(state: state)
            vc.gameCenterDelegate = self
            self.bridge?.viewController?.present(vc, animated: true)
            call.resolve(["shown": true])
        }
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
