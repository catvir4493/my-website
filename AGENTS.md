<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 项目记忆：更新后同步 GitHub

- 用户已授权：每次完成本项目的更新并通过相关检查后，自动创建 Git 提交并推送到 GitHub，无需再次确认。用户当次明确要求暂不提交或推送时，以当次要求为准。
- 仓库：`https://github.com/catvir4493/my-website`；默认推送到 `origin/main`。完成后简要报告同步结果。
- 保留版本更替：每次更新在现有历史之上创建新的独立提交，提交说明清楚描述修改内容，让用户能在 GitHub 的提交历史中查看旧版、新版及它们的差异。
- 不改写已经推送的历史：不对已发布提交执行 amend、rebase 或 squash，不通过 reset 后强制推送替换旧版本。需要回退已发布更新时，用新的 revert 提交保留变更记录。
- 同步完成后提供本次提交链接；用户需要查看版本更替时，提供提交历史或版本比较链接。
- 遵守 `.gitignore`，不提交密钥、本地环境变量、认证文件、依赖目录或构建缓存。
- 推送失败时保留本地提交并说明原因；不强制推送、不覆盖远端历史。
