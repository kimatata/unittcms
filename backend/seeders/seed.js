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
        avatar_path: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'samuel@example.com',
        password: hashedPassword,
        username: 'Samuel Golden',
        role: 1,
        avatar_path: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'trey@example.com',
        password: hashedPassword,
        username: 'Trey Fisher',
        role: 1,
        avatar_path: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'zoe@example.com',
        password: hashedPassword,
        username: 'Zoe Woodward',
        role: 1,
        avatar_path: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'roger@example.com',
        password: hashedPassword,
        username: 'Roger Hess',
        role: 1,
        avatar_path: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'jasmine@example.com',
        password: hashedPassword,
        username: 'Jasmine Moody',
        role: 1,
        avatar_path: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'tatsuya@example.com',
        password: hashedPassword,
        username: 'Suzuki Tatsuya',
        role: 1,
        avatar_path: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'eri@example.com',
        password: hashedPassword,
        username: 'Sato Eri',
        role: 1,
        avatar_path: null,
        created_at: new Date(),
        updated_at: new Date(),
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
        name: 'Iron Muscle App',
        detail: 'Pre-release overall evaluation',
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
        name: 'Account',
        detail: '',
        projectId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Tranning history',
        detail: '',
        projectId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Timeline',
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
        name: 'evaluation 1st',
        projectId: 2,
        configurations: 1,
        description: '5/14 - 5/31',
        state: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'evaluation 2nd',
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
        title: 'Register account with email address',
        state: 1,
        priority: 2,
        type: 4,
        automationStatus: 1,
        description: 'Enter email addres and password in the form and click the Sign Up button.',
        template: 0,
        preConditions: '- You are not signed in\n- You have no account.',
        expectedResults: 'You can sign up and you will be automatically redirected to your account page.',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Sign in with email',
        state: 1,
        priority: 2,
        type: 4,
        automationStatus: 1,
        description: 'nter email addres and password in the form and click the Sign In button.',
        template: 0,
        preConditions: 'You are not signed in',
        expectedResults: 'You can sign in and you will be automatically redirected to your account page.',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Social Account Sign In',
        state: 1,
        priority: 1,
        type: 4,
        automationStatus: 1,
        description: 'You can sign in to the app with your Google account.',
        template: 0,
        preConditions: 'You are not signed in',
        expectedResults: 'You can sign in and you will be automatically redirected to your account page.',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Edit Account',
        state: 1,
        priority: 3,
        type: 4,
        automationStatus: 1,
        description: 'You can update user name and avatar',
        template: 0,
        preConditions: 'Prepare sample avatar image file(.png, .svg, .jpg)',
        expectedResults: 'You can resister avatar image',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'View Account',
        state: 1,
        priority: 0,
        type: 1,
        automationStatus: 1,
        description: 'You cannot view not your account info',
        template: 1,
        preConditions: 'nothing',
        expectedResults: '',
        folderId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Muscle memory (Selection of muscle train part)',
        state: 1,
        priority: 2,
        type: 1,
        automationStatus: 1,
        description: 'Selection of muscle train part',
        template: 1,
        preConditions: 'nothing',
        expectedResults: 'Able to choose which parts of your body to train',
        folderId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Muscle Memory (training sessions selection)',
        state: 1,
        priority: 2,
        type: 1,
        automationStatus: 1,
        description: 'sessions selection',
        template: 1,
        preConditions: 'nothing',
        expectedResults: 'Able to select the number of muscle training sessions',
        folderId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Muscle Memory(closing dialog)',
        state: 1,
        priority: 3,
        type: 3,
        automationStatus: 1,
        description: 'dialog functional check',
        template: 1,
        preConditions: 'open the dialog',
        expectedResults: 'able to close the dialog by clicking "x" button',
        folderId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Muscle Memory(selectio dialog)',
        state: 1,
        priority: 3,
        type: 3,
        automationStatus: 1,
        description: 'responsibility of selection dialog',
        template: 1,
        preConditions: 'access the app by mobile device',
        expectedResults: 'dialog will be displayed properly',
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
        step: 'Open browser with secret mode',
        result: 'Open Local Storage in Developer Tools and confirm that there is no session.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        step: "move to 'account/userinfo?userid=xxx' page",
        result: 'Redirected to an error page with a 403 error.',
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
