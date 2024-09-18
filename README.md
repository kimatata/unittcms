# UnitTCMS

UnitTCMS is an open source test case management system. The application is free and designed for self-hosted use. It can be used in environments with strict security requirements. For more information, please visit the demo site and docs.

[🧪Demo](https://www.unittcms.org)

[📘Docs](https://kimatata.github.io/unittcms/docs)

## Getting Started

```bash
git clone https://github.com/kimatata/unittcms.git
```

and start containers with the following command.

```bash
cd unittcms
docker-compose up --build
```

You can access the app at `http://localhost:8000`

[Looking for a non-Docker way?](https://kimatata.github.io/unittcms/docs/getstarted/manual)

## Features

### Project-Based

Manage test cases and test runs on a project-by-project basis. Our dashboard provides an at-a-glance view of the types of test cases and their progress for each project. This allows you to monitor project status in real-time and manage efficiently.

![Project-Based](./frontend/public/top/light/project.png)

<hr />

### Test case management

Create folders within projects and define test cases with ease using our modern and intuitive UI. Attaching files enables detailed explanations of test cases, making it easy to share information across the entire team.

![Test Case Management](./frontend/public/top/light/case.png)

<hr />

### Test run management

Defined test cases can be reused multiple times in test runs, enabling efficient test cycles. Additionally, you can visually monitor the status of test runs and projects.

![Test Run Management](./frontend/public/top/light/run.png)

<hr />

### Project member management

Support team development by adding or removing members from projects. You can assign roles and set permissions for each member in detail. We provide three main roles: 'Manager' who manages the entire project, 'Developer' who designs the tests, and 'Reporter' who executes the tests.

![Member Management](./frontend/public/top/light/member.png)
