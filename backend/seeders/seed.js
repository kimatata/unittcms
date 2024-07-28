'use strict';
const fs = require('fs');
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password', 10);

    // Add projects table records
    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@example.com',
        password: hashedPassword,
        username: 'Admin',
        role: 0,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'samuel@example.com',
        password: hashedPassword,
        username: 'Samuel Golden',
        role: 1,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'trey@example.com',
        password: hashedPassword,
        username: 'Trey Fisher',
        role: 1,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'zoe@example.com',
        password: hashedPassword,
        username: 'Zoe Woodward',
        role: 1,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'roger@example.com',
        password: hashedPassword,
        username: 'Roger Hess',
        role: 1,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'jasmine@example.com',
        password: hashedPassword,
        username: 'Jasmine Moody',
        role: 1,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'tatsuya@example.com',
        password: hashedPassword,
        username: 'Suzuki Tatsuya',
        role: 1,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'eri@example.com',
        password: hashedPassword,
        username: 'Sato Eri',
        role: 1,
        avatarPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add projects table records
    await queryInterface.bulkInsert('projects', [
      {
        name: 'UnitTCMS Test',
        detail: "Test Plat's Manual test",
        userId: 1,
        isPublic: true,
        createdAt: new Date(2024, 5, 4),
        updatedAt: new Date(),
      },
      {
        name: 'Iron Muscle App(筋トレアプリ)',
        detail: 'リリース前総合評価',
        userId: 1,
        isPublic: true,
        createdAt: new Date(2024, 6, 10),
        updatedAt: new Date(),
      },
      {
        name: 'MS200',
        detail: '',
        userId: 1,
        isPublic: true,
        createdAt: new Date(2024, 6, 24),
        updatedAt: new Date(),
      },
    ]);

    // Add folders table records
    await queryInterface.bulkInsert('folders', [
      {
        name: 'Account',
        detail: '',
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Contact',
        detail: '',
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'アカウント',
        detail: '',
        projectId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'トレーニング記録',
        detail: '',
        projectId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'タイムライン',
        detail: '',
        projectId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Chart',
        detail: '',
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Simulate',
        detail: '',
        projectId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add runs table records
    await queryInterface.bulkInsert('runs', [
      {
        name: 'First Test Run',
        projectId: 1,
        configurations: 1,
        description: '5/14 - 5/31',
        state: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: '総合評価第一回',
        projectId: 2,
        configurations: 1,
        description: '5/14 - 5/31',
        state: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: '総合評価第二回',
        projectId: 2,
        configurations: 1,
        description: '6/1 - 6/12',
        state: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add cases table records
    await queryInterface.bulkInsert('cases', [
      {
        title: 'Signup',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: 'User can signup from signup form.',
        template: 1,
        preConditions: 'Not signed in',
        expectedResults: '',
        folderId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Signin',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: 'User can signin from signin form.',
        template: 1,
        preConditions: 'Not signed in',
        expectedResults: '',
        folderId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Contact',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: "User can send inquiry from 'contact us' form.",
        template: 0,
        preConditions: '',
        expectedResults: '',
        folderId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'メールアドレスでのアカウント登録',
        state: 1,
        priority: 2,
        type: 4,
        automationStatus: 1,
        description: 'メールアドレス、パスワードをフォームに入力してサインアップボタンを押す',
        template: 0,
        preConditions: '未サインイン状態であること。アカウントがないこと。',
        expectedResults: 'サインアップができ、自動でアカウントページに遷移する',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'メールアドレスでのサインイン',
        state: 1,
        priority: 2,
        type: 4,
        automationStatus: 1,
        description: 'メールアドレス、パスワードをフォームに入力してサインインボタンを押す',
        template: 0,
        preConditions: '未サインイン状態であること',
        expectedResults: 'サインインができ、自動でアカウントページに遷移する',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'ソーシャルアカウントサインイン',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: 'Googleアカウントで筋トレアプリにサインインできること',
        template: 0,
        preConditions: '未サインイン状態であること',
        expectedResults: 'サインインでき、自動でアカウントページに遷移する',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'アカウント情報編集',
        state: 1,
        priority: 3,
        type: 4,
        automationStatus: 1,
        description: 'ユーザー名、アバター画像を変更できること',
        template: 0,
        preConditions: 'アバター画像(.png, .svg, .jpg)を用意する',
        expectedResults: 'アバター画像を登録できること',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'アカウント閲覧',
        state: 1,
        priority: 0,
        type: 1,
        automationStatus: 1,
        description: 'ほかの人のアカウント情報は見れないこと',
        template: 1,
        preConditions: '特になし',
        expectedResults: '',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: '筋トレ記録（部位選択）',
        state: 1,
        priority: 2,
        type: 1,
        automationStatus: 1,
        description: '部位選択',
        template: 1,
        preConditions: '特になし',
        expectedResults: '筋トレ部位を選択できること',
        folderId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: '筋トレ記録（回数選択）',
        state: 1,
        priority: 2,
        type: 1,
        automationStatus: 1,
        description: '回数選択',
        template: 1,
        preConditions: '特になし',
        expectedResults: '筋トレ回数を選択できること',
        folderId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: '筋トレ記録 ダイアログのクローズ',
        state: 1,
        priority: 3,
        type: 3,
        automationStatus: 1,
        description: '選択ダイアログの機能性確認',
        template: 1,
        preConditions: 'ダイアログを開く',
        expectedResults: 'ダイアログの「×」ボタンを押して閉じれること',
        folderId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: '筋トレ記録 選択ダイアログ',
        state: 1,
        priority: 3,
        type: 3,
        automationStatus: 1,
        description: '選択ダイアログのレスポンシブ確認',
        template: 1,
        preConditions: 'スマホでウェブサイトにアクセスする',
        expectedResults: 'ダイアログの表示がおかしくないこと',
        folderId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Chart display',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: '',
        template: 0,
        preConditions: '',
        expectedResults: '',
        folderId: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Chart update',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: '',
        template: 0,
        preConditions: '',
        expectedResults: '',
        folderId: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Chart palette color change',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: '',
        template: 0,
        preConditions: '',
        expectedResults: '',
        folderId: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Simlation exec',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: '',
        template: 0,
        preConditions: '',
        expectedResults: '',
        folderId: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Simlation update',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: '',
        template: 0,
        preConditions: '',
        expectedResults: '',
        folderId: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Simlation result palette color',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: '',
        template: 0,
        preConditions: '',
        expectedResults: '',
        folderId: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Simlation button disable condition',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: '',
        template: 0,
        preConditions: '',
        expectedResults: '',
        folderId: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add steps table records
    await queryInterface.bulkInsert('steps', [
      {
        step: 'Check accout status',
        result: 'Never have account',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        step: "Enter signup form and then, click 'signup' button.",
        result: 'Automatically redirect to the account page',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        step: 'Check signin status',
        result: 'Not signed in',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        step: "Enter signin form and then, click 'signin button.'",
        result: 'Automatically redirect to the account page',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        step: 'ブラウザのシークレットモードに入る',
        result: '開発者モードのLocal Storageを開き、sessionがないことを確認する。',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        step: "'account/userinfo?userid=xxx'に遷移する",
        result: 'エラーページにリダイレクトされ、403エラーなこと。',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Add case-step join table
    await queryInterface.bulkInsert('caseSteps', [
      {
        caseId: 1,
        stepId: 1,
        stepNo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 1,
        stepId: 2,
        stepNo: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 2,
        stepId: 3,
        stepNo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 2,
        stepId: 4,
        stepNo: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 8,
        stepId: 5,
        stepNo: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 8,
        stepId: 6,
        stepNo: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:8001';
    await queryInterface.bulkInsert('attachments', [
      {
        title: 'Selenium logo',
        detail: '',
        path: `${backendOrigin}/uploads/861px-Selenium_Logo.png`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'vitest logo',
        detail: '',
        path: `${backendOrigin}/uploads/logo-shadow.svg`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // copy sample files to uploads folder
    const sampleFolderPath = 'public/sample';
    const uploadsFolderPath = 'public/uploads';
    const SeleniumLogoFileName = '861px-Selenium_Logo.png';
    const vitestLogoFileName = 'logo-shadow.svg';
    if (!fs.existsSync(uploadsFolderPath)) {
      fs.mkdirSync(uploadsFolderPath, { recursive: true });
    }
    fs.copyFile(
      `${sampleFolderPath}/${SeleniumLogoFileName}`,
      `${uploadsFolderPath}/${SeleniumLogoFileName}`,
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
    fs.copyFile(`${sampleFolderPath}/${vitestLogoFileName}`, `${uploadsFolderPath}/${vitestLogoFileName}`, (err) => {
      if (err) {
        console.log(err);
      }
    });

    await queryInterface.bulkInsert('caseAttachments', [
      {
        caseId: 1,
        attachmentId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        caseId: 1,
        attachmentId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('runCases', [
      {
        runId: 1,
        caseId: 1,
        status: 1,
        createdAt: new Date(2024, 5, 15),
        updatedAt: new Date(2024, 5, 15),
      },
      {
        runId: 1,
        caseId: 2,
        status: 1,
        createdAt: new Date(2024, 5, 15),
        updatedAt: new Date(2024, 5, 15),
      },
      {
        runId: 1,
        caseId: 13,
        status: 1,
        createdAt: new Date(2024, 5, 18),
        updatedAt: new Date(2024, 5, 18),
      },
      {
        runId: 1,
        caseId: 14,
        status: 1,
        createdAt: new Date(2024, 5, 18),
        updatedAt: new Date(2024, 5, 18),
      },
      {
        runId: 1,
        caseId: 15,
        status: 1,
        createdAt: new Date(2024, 5, 18),
        updatedAt: new Date(2024, 5, 18),
      },
      {
        runId: 1,
        caseId: 16,
        status: 0,
        createdAt: new Date(2024, 5, 15),
        updatedAt: new Date(2024, 5, 15),
      },
      {
        runId: 1,
        caseId: 17,
        status: 0,
        createdAt: new Date(2024, 5, 16),
        updatedAt: new Date(2024, 5, 16),
      },
      {
        runId: 1,
        caseId: 18,
        status: 2,
        createdAt: new Date(2024, 5, 16),
        updatedAt: new Date(2024, 5, 16),
      },
      {
        runId: 1,
        caseId: 19,
        status: 3,
        createdAt: new Date(2024, 5, 17),
        updatedAt: new Date(2024, 5, 17),
      },
    ]);

    await queryInterface.bulkInsert('members', [
      {
        userId: 2,
        projectId: 1,
        role: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 7,
        projectId: 1,
        role: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 8,
        projectId: 1,
        role: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // do nothingg
  },
};
