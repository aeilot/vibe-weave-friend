# SoulLink - AI 情感陪伴助手

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple)](https://vitejs.dev/)

一个基于 AI 的智能情感陪伴应用，提供个性化对话、情绪分析、成长档案等功能。

[在线演示](https://lovable.dev/projects/fb6223f7-d697-4868-bc5e-8a99345a69e0) | [报告问题](../../issues) | [功能请求](../../issues)

</div>

---

## 📖 目录

- [✨ 特性](#-特性)
- [🏗️ 架构](#️-架构)
- [🚀 快速开始](#-快速开始)
- [📦 技术栈](#-技术栈)
- [🔧 配置](#-配置)
- [📱 功能详解](#-功能详解)
- [🔐 安全性](#-安全性)
- [🚢 部署](#-部署)
- [📚 文档](#-文档)
- [🤝 贡献](#-贡献)
- [📄 许可证](#-许可证)

---

## ✨ 特性

### 核心功能

#### 🤖 AI 智能陪伴
- **个性化对话**：基于 OpenAI GPT 的智能对话系统
- **自适应个性**：AI 会根据对话历史自动调整回复风格
- **主动关怀**：后台任务系统支持 AI 主动发起对话
- **记忆功能**：记住用户偏好和重要信息
- **情绪识别**：自动检测对话中的情绪倾向

#### 👥 社交互动
- **群聊功能**：创建和加入多人聊天群组
- **关系分析**：AI 分析社交互动模式和关系网络
- **实时通信**：流畅的实时消息传递体验

#### 📚 成长档案（Archive）
- **AI 日记生成**：基于对话自动生成个性化日记（需登录）
- **日记编辑**：支持手动编辑 AI 生成的日记内容
- **情绪追踪**：记录和分析情绪变化趋势
- **情绪健康监测**：
  - 情绪稳定性评估
  - 压力管理指数
  - 积极程度评分
  - 睡眠质量追踪
  - AI 健康建议
- **情绪日历**：可视化展示每日情绪状态
- **关系洞察**：分析社交互动和沟通习惯
- **成长里程碑**：记录重要成长时刻
- **成就系统**：解锁各种成就徽章

#### 🎨 个性化设置
- **AI 个性配置**：
  - 自定义 AI 名称
  - 设置个性特质（关怀、倾听、温暖等）
  - 编辑系统提示词（System Prompt）
  - AI 个性优化建议（基于对话历史）
- **API 配置**：
  - 支持自定义 OpenAI API Key
  - 可配置 API Endpoint（支持兼容的第三方服务）
  - 模型选择（GPT-3.5, GPT-4 等）
- **管理员设置**：
  - 强制指定全局 API 配置
  - 本地程序接口支持

#### 🔐 用户系统
- **Clerk 认证**：安全的用户认证系统
- **访客模式**：无需登录即可体验基础功能
- **数据隔离**：每个用户的数据完全独立
- **退出清理**：登出时自动清除用户数据，保护隐私

### 技术特性

- 🎯 **TypeScript**：完整的类型安全
- 🎨 **现代 UI**：基于 shadcn/ui 的美观界面
- 📱 **响应式设计**：完美适配移动端和桌面端
- 🌓 **深色模式**：支持主题切换
- ⚡ **性能优化**：Vite 构建，加载快速
- 💾 **数据持久化**：localStorage + Prisma ORM 双模式
- 🔄 **状态管理**：React Query 处理异步状态

---

## 🏗️ 架构

### 系统架构

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)              │
│  ┌───────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Pages    │  │  Hooks   │  │  Components  │ │
│  └───────────┘  └──────────┘  └──────────────┘ │
│         │              │              │          │
│         └──────────────┴──────────────┘          │
│                       │                          │
│              ┌────────▼────────┐                 │
│              │   Services      │                 │
│              │  ┌──────────┐   │                 │
│              │  │ db.ts    │   │                 │
│              │  │ ai.ts    │   │                 │
│              │  └──────────┘   │                 │
│              └────────┬────────┘                 │
└───────────────────────┼─────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼─────┐
   │ Clerk   │    │ OpenAI  │    │LocalStore│
   │  Auth   │    │   API   │    │/Prisma DB│
   └─────────┘    └─────────┘    └──────────┘
```

### 数据模型

```typescript
User
  ├── Conversations
  │   └── Messages
  ├── DiaryEntries (Archive)
  ├── Memories
  ├── UserSettings
  └── GroupMembers
      └── Groups
          └── GroupMessages
```

### 核心服务

1. **DatabaseService (`db.ts`)**
   - 统一的数据访问层
   - 支持 localStorage 和 Prisma 两种模式
   - 完整的 CRUD 操作

2. **AI Service (`ai.ts`)**
   - OpenAI API 集成
   - 对话生成和管理
   - 日记生成
   - 情绪分析
   - 社交关系分析

3. **Auth Service (`use-auth.tsx`)**
   - Clerk 集成
   - 用户状态管理
   - 自动同步用户数据

---

## 🚀 快速开始

### 前置要求

- Node.js 16.x 或更高版本
- npm 或 pnpm
- （可选）Clerk 账号（用于用户认证）
- （可选）OpenAI API Key（用于 AI 功能）
- （可选）Neon 数据库（用于生产环境）

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/aeilot/soullink.git
cd soullink
```

2. **安装依赖**

```bash
npm install
# 或
pnpm install
```

3. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Clerk 认证（可选，不配置则无法使用登录功能）
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Neon 数据库（可选，不配置则使用 localStorage）
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
DIRECT_URL=postgresql://user:password@host/database
```

4. **运行开发服务器**

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173)

### 访客模式快速体验

如果不想配置认证系统，可以直接使用访客模式：

1. 启动应用后，直接使用而无需登录
2. 在 Profile 页面配置你的 OpenAI API Key
3. 即可开始与 AI 对话

> ⚠️ **注意**：访客模式的数据仅保存在浏览器 localStorage 中，清除浏览器数据会导致数据丢失。

---

## 📦 技术栈

### 前端框架

- **React 18.3** - UI 框架
- **TypeScript 5.8** - 类型安全
- **Vite 5.4** - 构建工具
- **React Router 6** - 路由管理

### UI 组件

- **shadcn/ui** - 组件库
- **Tailwind CSS 3.4** - 样式框架
- **Radix UI** - 无障碍组件
- **Lucide React** - 图标库

### 状态管理 & 数据

- **React Query (TanStack Query)** - 异步状态管理
- **React Hook Form** - 表单管理
- **Zod** - 数据验证

### 认证 & 数据库

- **Clerk** - 用户认证
- **Prisma** - ORM（可选）
- **Neon** - PostgreSQL 数据库（可选）
- **localStorage** - 前端存储（默认）

### AI 集成

- **OpenAI SDK** - GPT API 集成
- 支持自定义 API Endpoint（兼容第三方服务）

---

## 🔧 配置

### 1. 认证配置（Clerk）

详细步骤请参考 [CLERK_SETUP.md](./CLERK_SETUP.md)

### 2. AI API 配置

有三种配置方式：

#### 方式一：用户自定义（默认）

用户在 Profile 页面配置自己的 API Key：

1. 进入 Profile > AI API 配置
2. 输入 API Key、Endpoint 和 Model
3. 保存配置

#### 方式二：管理员强制配置

在 Profile > 管理员设置中：

1. 开启"强制指定 API"
2. 配置全局 API Key 和 Endpoint
3. 所有用户将使用统一的 API 配置

#### 方式三：本地程序接口

如果你有本地 AI 服务：

1. 在管理员设置中开启"使用本地程序接口"
2. 输入本地服务 URL
3. 确保本地服务兼容 OpenAI API 格式

### 3. 个性化配置

在 Profile > AI 个性设置中可以配置：

- **AI 名称**：给你的 AI 助手起名字
- **个性特质**：定义 AI 的性格特点
- **系统提示词**：详细定义 AI 的行为方式

**提示词编写建议**：
- 明确定义 AI 的角色和身份
- 说明 AI 应该如何回复（语气、风格、长度）
- 列出 AI 的主要特质和行为准则
- 指定特殊要求（如使用表情符号、记住信息等）

### 4. 数据库配置（可选）

详细步骤请参考 [DATABASE_CONFIGURATION.md](./DATABASE_CONFIGURATION.md)

---

## 📱 功能详解

### 主页 - AI 对话

- 与 AI 进行自然对话
- 支持多轮对话记忆
- 每 10 条消息自动生成摘要
- 查看对话历史和统计

### 群组 - 社交互动

- 创建新群聊
- 加入现有群组
- 群组消息实时同步
- 查看群组成员

### 档案 - 成长记录

**访客限制**：档案页面的核心功能需要登录才能使用

#### 日记 Tab
- ✅ 查看日记列表（登录后）
- ✅ AI 自动生成日记（登录后）
- ✅ 编辑日记内容（登录后）
- ❌ 未登录时显示登录提示

#### 情绪 Tab
- ✅ 情绪趋势分析
- ✅ AI 情绪洞察（登录后）
- ✅ **情绪健康监测**（登录后）：
  - 情绪稳定性指标
  - 压力管理评分
  - 积极程度追踪
  - 睡眠质量评估
  - AI 个性化健康建议
- ✅ 情绪日历可视化
- ❌ AI 功能需要登录

#### 关系 Tab
- ✅ 社交互动分析
- ✅ AI 沟通习惯分析（登录后）
- ❌ AI 功能需要登录

#### 里程碑 Tab
- ✅ 成长时间轴
- ✅ 成就徽章系统

### Profile - 个人中心

- 查看用户信息和统计
- 配置 AI API
- 设置 AI 个性
- 管理员配置（强制 API）
- 退出登录（自动清除数据）

---

## 🔐 安全性

### API Key 管理

⚠️ **重要安全说明**：

当前版本中，用户配置的 API Key 以明文形式存储在 localStorage 或数据库中。这是为了让应用能够代表用户调用 API。

**生产环境建议**：

1. **后端代理模式**：
   - 在后端服务器中存储 API Key
   - 前端通过后端代理调用 OpenAI API
   - 避免在前端暴露 API Key

2. **加密存储**：
   - 使用加密算法加密存储 API Key
   - 实现安全的密钥管理系统

3. **使用管理员强制配置**：
   - 由管理员统一配置 API Key
   - 用户无需输入自己的 Key

详细安全建议请参考 [SECURITY_API_KEYS.md](./SECURITY_API_KEYS.md)

### 数据隐私

- 每个用户的数据完全隔离
- 退出登录时自动清除用户数据
- 支持访客模式，无需注册
- 群组数据在用户间共享

### 认证安全

- Clerk 提供企业级安全认证
- 支持 OAuth 社交登录
- 会话管理自动化
- CSRF 保护

---

## 🚢 部署

### 方式一：前端静态部署（仅 localStorage）

适合快速体验和小规模使用：

1. **构建**：
```bash
npm run build
```

2. **部署到任意静态托管服务**：
   - Vercel
   - Netlify
   - GitHub Pages
   - Cloudflare Pages

### 方式二：完整部署（含数据库）

推荐用于生产环境：

1. **设置 Neon 数据库**：
   - 访问 [Neon Console](https://console.neon.tech)
   - 创建新项目和数据库
   - 复制连接字符串

2. **配置环境变量**：
```env
DATABASE_URL=your_neon_connection_string
DIRECT_URL=your_neon_direct_connection_string
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

3. **运行数据库迁移**：
```bash
npx prisma migrate deploy
```

4. **部署到 Vercel**（推荐）：
```bash
npm i -g vercel
vercel
```

详细部署指南请参考 [DATABASE_CONFIGURATION.md](./DATABASE_CONFIGURATION.md)

---

## 📚 文档

- [CLERK_SETUP.md](./CLERK_SETUP.md) - Clerk 认证配置详解
- [NEON_SETUP.md](./NEON_SETUP.md) - Neon 数据库配置
- [DATABASE_CONFIGURATION.md](./DATABASE_CONFIGURATION.md) - 完整数据库配置指南
- [PRISMA_AI_IMPLEMENTATION.md](./PRISMA_AI_IMPLEMENTATION.md) - AI 实现细节
- [ADVANCED_AI_FEATURES.md](./ADVANCED_AI_FEATURES.md) - 高级 AI 功能文档
- [SECURITY_API_KEYS.md](./SECURITY_API_KEYS.md) - API 密钥安全指南
- [SECURITY_AUTHENTICATION.md](./SECURITY_AUTHENTICATION.md) - 认证安全文档

---

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发指南

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 运行 Lint
npm run lint

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [OpenAI](https://openai.com) - AI 能力支持
- [Clerk](https://clerk.com) - 认证服务
- [Neon](https://neon.tech) - 数据库服务
- [shadcn/ui](https://ui.shadcn.com) - UI 组件
- [Lovable](https://lovable.dev) - 开发平台

---

## 📮 联系方式

- 项目主页：[https://github.com/aeilot/soullink](https://github.com/aeilot/soullink)
- 问题反馈：[Issues](https://github.com/aeilot/soullink/issues)
- 在线演示：[Lovable Project](https://lovable.dev/projects/fb6223f7-d697-4868-bc5e-8a99345a69e0)

---

<div align="center">

**[⬆ 回到顶部](#soullink---ai-情感陪伴助手)**

Made with ❤️ by the SoulLink Team

</div>
