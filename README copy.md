# LearningHub - 学习社群后端系统

## 1. 项目介绍 (About The Project)

**LearningHub** 是一个专为学生设计的、支持高并发的智能学习社群平台后端系统。项目旨在为百万级用户提供一个稳定、高效、可弹性扩容的在线交流环境，支持学生根据兴趣（如编程、英语、考研等）自由创建和加入学习小组，并通过 WebSocket 实现小组内的实时消息通信。

本系统在设计上充分考虑了高性能和高可用性，预计需支撑 **100万** 注册用户，**20万** 日活跃用户，以及峰值高达**每秒2000条**的小组内实时消息并发量。

---

## 2. 核心功能 (Core Features)

-   **👤 用户系统 (User Management)**
    -   支持用户通过用户名/密码进行注册、登录和安全退出。
    -   提供完善的个人资料管理功能，包括修改昵称、头像、邮箱等。
    -   *当前实现*: 兴趣标签功能已实现，但数据库中暂存为 String 类型，未来可优化为更灵活的标签系统。

-   **🤝 小组管理 (Community Management)**
    -   用户可以创建自己的学习小组，并设置名称、介绍和分类。
    -   提供小组列表的浏览和搜索功能。
    -   支持用户自由申请加入或退出小组。
    -   *当前实现*: 已实现群主对成员的管理功能。未来可扩展支持多层级的管理员角色（如设置协管员）。

-   **💬 实时消息服务 (Real-time Messaging)**
    -   基于 **WebSocket** 和 **STOMP** 协议，实现低延迟的群组内实时文本消息收发。
    -   消息在后端按时间戳精确排序，保证时序性。

-   **📦 离线消息与历史记录 (Offline & History Message)**
    -   支持用户拉取指定社群的历史聊天记录。
    -   *当前实现*: 已支持拉取历史消息。未来将重点优化大规模消息的拉取性能，并实现精细化的已读/未读状态管理。

-   **✔️ 打卡与排行榜 (Check-in & Leaderboard)**
    -   社群管理员可开启周期性打卡任务（例如：每日读书打卡）。
    -   成员可对任务执行打卡操作，系统将自动记录。
    -   基于 **Redis Bitmap** 高效实现，提供实时的个人打卡统计（连续天数、月度总数）和社群打卡排行榜。

---

## 3. 技术栈 (Technology Stack)

| 类别                | 技术                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| **后端核心**        | Spring Boot, Spring MVC, Spring Security                                      |
| **数据库**          | MySQL                                                                         |
| **数据访问层**      | MyBatis, MyBatis-Plus, HikariCP (数据库连接池)                                  |
| **实时通信**        | Spring WebSocket, STOMP (Simple Text Oriented Messaging Protocol)             |
| **缓存/内存数据库** | Redis (用于用户会话管理、热点数据缓存、以及通过 Bitmap 实现高性能打卡统计)    |
| **异步/消息队列**   | Spring `@Async` (用于异步写入打卡记录), RabbitMQ (用于系统其他异步任务)       |
| **API文档**         | SpringDoc (OpenAPI 3), Knife4j (增强UI)                                       |

---

## 4. 架构亮点 (Architecture Highlights)

-   **读写分离**: 数据库层面配置了主从数据源，将写操作路由到主库，读操作路由到从库，有效分摊数据库压力。
-   **Redis 高效应用**:
    -   **会话管理**: 使用 Redis 存储用户登录 Token，实现无状态、可横向扩展的认证体系。
    -   **高性能计数**: 巧妙运用 Redis 的 **Bitmap** 数据结构实现日度打卡功能，百万用户的月度打卡数据仅占用极小的内存空间，并能以 O(1) 的时间复杂度完成单日打卡，O(N) 的时间复杂度完成月度统计。
-   **异步解耦**:
    -   对于打卡记录的持久化等非核心路径操作，采用 Spring `@Async` 异步写入数据库，大幅降低了主流程API的响应延迟。
    -   整合 RabbitMQ，为未来更复杂的异步任务（如消息推送、数据聚合分析）提供了基础。
-   **实时通信**: 采用成熟的 WebSocket + STOMP 方案，提供可靠的双向通信信道，并能通过消息代理（Broker）轻松实现群组消息的发布/订阅模型。

---

## 5. API 接口文档 (API Endpoints)

### 用户接口 (`/api/users`)

| 描述                 | 方法   | 路径                  | 请求体/参数示例                                  |
| -------------------- | ------ | --------------------- | ------------------------------------------------ |
| 用户登录             | `POST` | `/login`              | `{"identifier": "user", "password": "123"}`      |
| 用户注册             | `POST` | `/register`           | `{"username": "new", "password": "123"}`         |
| 获取当前用户信息     | `GET`  | `/me`                 | N/A (需认证)                                     |
| 发送手机验证码       | `POST` | `/code?phone=...`     | N/A                                              |
| 退出登录             | `POST` | `/logout`             | N/A (需认证)                                     |
| 获取所有用户         | `GET`  | `/`                   | N/A                                              |
| 根据ID获取用户       | `GET`  | `/{id}`               | N/A                                              |
| 编辑用户资料         | `PUT`  | `/{id}`               | `{"email": "a@b.com", "gender": "Male"}` (需认证) |
| 注销用户             | `DELETE` | `/{id}`             | N/A (需认证)                                     |

### 社群接口 (`/api/community`)

| 描述                     | 方法   | 路径                  | 请求体/参数示例                                          |
| ------------------------ | ------ | --------------------- | -------------------------------------------------------- |
| 创建社群                 | `POST` | `/create`             | `{"name": "Java学习", "description": "..."}` (需认证) |
| 审核创建的社群           | `POST` | `/updateStatus`       | `?communityId=1&status=1` (需管理员权限)               |
| 获取待审核社群列表       | `GET`  | `/listByStatus`       | `?status=0` (需管理员权限)                             |
| 获取社群列表             | `GET`  | `/list`               | `?page=1&size=10`                                       |
| 根据ID获取社群详情       | `GET`  | `/{id}`               | N/A                                                      |
| 获取社群成员列表         | `GET`  | `/members/{id}`       | N/A                                                      |

### 社群申请接口 (`/api/community/applications`)

| 描述                     | 方法   | 路径                         | 请求体/参数示例                                          |
| ------------------------ | ------ | ---------------------------- | -------------------------------------------------------- |
| 用户提交加群申请         | `POST` | `/apply`                     | `?communityId=1&reason=我想学习Java` (需认证)          |
| 获取待审核申请列表       | `GET`  | `/pending`                   | `?communityId=1` (需群主/管理员权限)                   |
| 获取所有待审核申请       | `GET`  | `/pendingAll`                | N/A (需群主/管理员权限)                                |
| 审核加群申请             | `POST` | `/review`                    | `?applicationId=1&status=APPROVED` (需群主/管理员权限)  |
| 退出社群                 | `POST` | `/leave`                     | `?communityId=1` (需认证，群主不可退出)                |
| 踢出群成员               | `POST` | `/deleteMebers`              | `?communityId=1&userId=2` (需群主/管理员权限)          |
| 设置管理员               | `POST` | `/setAdmin`                  | `?communityId=1&userId=2` (需群主权限)                 |
| 禁言                     | `POST` | `/setBans`                   | `?communityId=1&userId=2` (需群主/管理员权限)          |
| 解除禁言                 | `POST` | `/cancelBans`                | `?communityId=1&userId=2` (需群主/管理员权限)          |
| 取消管理员               | `POST` | `/cancelAdmins`              | `?communityId=1&userId=2` (需群主权限)                 |

### 聊天接口 (`/api/chat`)

| 描述                     | 方法   | 路径                         | 请求体/参数示例                                          |
| ------------------------ | ------ | ---------------------------- | -------------------------------------------------------- |
| 获取历史聊天记录         | `GET`  | `/history`                   | `?communityId=1&page=1&size=20`                         |
| 获取离线期间聊天记录     | `GET`  | `/history-offline`           | `?communityId=1&page=1&size=20`                         |
| 获取在线用户数           | `GET`  | `/online/count`              | `?communityId=1`                                         |

### 实时聊天接口 (WebSocket/STOMP)

1.  **连接端点**:
    -   `ws://<your_host>/ws-chat/websocket?userId={uid}&communityId={cid}`
    -   **注意**: 建立 STOMP 连接时，需要在 CONNECT 帧的 Header 中附带 `Authorization` Token。

2.  **消息收发**:
    -   **发送消息 (SEND)**:
        -   **目的地**: `/app/chat/{communityId}`
        -   **消息体 (JSON)**: `{"senderId": 1, "content": "Hello!"}`
    -   **订阅消息 (SUBSCRIBE)**:
        -   **目的地**: `/topic/chat/{communityId}`

### 打卡与排行榜接口 (`/api/check-in`)

| 描述                 | 方法   | 路径                         | 请求体/参数示例                                          |
| -------------------- | ------ | ---------------------------- | -------------------------------------------------------- |
| 创建打卡任务         | `POST` | `/tasks`                     | `{"communityId": 1, "taskName": "每日算法题"}` (需认证) |
| 用户执行打卡         | `POST` | `/tasks/{taskId}/records`    | N/A (需认证)                                             |
| 获取个人打卡状态     | `GET`  | `/tasks/{taskId}/status`     | N/A (需认证)                                             |
| 获取打卡排行榜       | `GET`  | `/tasks/{taskId}/leaderboard`| N/A (需认证)                                             |

### 通用接口 (`/api/common`)

| 描述                 | 方法   | 路径                         | 请求体/参数示例                                          |
| -------------------- | ------ | ---------------------------- | -------------------------------------------------------- |
| 文件上传             | `POST` | `/upload`                    | `file` (multipart/form-data)                             |

---

## 6. 如何运行 (Getting Started)

1.  **配置环境**:
    -   修改 `src/main/resources/application.yaml` 文件，配置正确的 MySQL 和 Redis 连接信息。
    -   在您的 MySQL 实例中执行项目所需的 SQL 脚本，创建数据库和表。

2.  **启动应用**:
    在项目根目录下，执行以下命令：
    ```bash
    ./mvnw spring-boot:run
    ```

3.  **API文档**:
    应用启动后，您可以访问以下地址查看由 Knife4j 提供的增强版API文档：
    `http://localhost:8080/doc.html`

---

## 7. 未来规划 (Roadmap)

-   [ ] **权限系统增强**: 引入更细粒度的角色管理，例如社群管理员、协管员。
-   [ ] **标签系统优化**: 将用户兴趣标签和小组分类改造为独立的数据模型，支持更高效的检索和推荐。
-   [ ] **消息功能深化**: 实现消息已读/未读状态跟踪，并对离线消息拉取逻辑进行性能优化。
-   [ ] **内容服务扩展**: 增加文件、图片等多媒体消息的支持。 