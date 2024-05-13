"use strict";(self.webpackChunktest_case_manager_doc=self.webpackChunktest_case_manager_doc||[]).push([[955],{1146:(t,e,s)=>{s.r(e),s.d(e,{assets:()=>c,contentTitle:()=>r,default:()=>u,frontMatter:()=>i,metadata:()=>o,toc:()=>m});var n=s(5893),a=s(1151);const i={sidebar_position:4},r="Integration",o={id:"architecture/integration",title:"Integration",description:"We would like to be able to display results not only from manual test management, but also from automated test tools such as Vitest, Google Test, Selenium, etc.",source:"@site/docs/architecture/integration.md",sourceDirName:"architecture",slug:"/architecture/integration",permalink:"/TestPlat/docs/architecture/integration",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/architecture/integration.md",tags:[],version:"current",sidebarPosition:4,frontMatter:{sidebar_position:4},sidebar:"tutorialSidebar",previous:{title:"DataBase",permalink:"/TestPlat/docs/architecture/er"}},c={},m=[];function l(t){const e={code:"code",h1:"h1",img:"img",p:"p",pre:"pre",...(0,a.a)(),...t.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(e.h1,{id:"integration",children:"Integration"}),"\n",(0,n.jsx)(e.p,{children:"We would like to be able to display results not only from manual test management, but also from automated test tools such as Vitest, Google Test, Selenium, etc."}),"\n",(0,n.jsx)(e.p,{children:"Since the JUnit xml format is the de facto standard, we will import via the xml file. TestPlat itself should also be able to report manual test results in Junit XML format."}),"\n",(0,n.jsx)(e.p,{children:(0,n.jsx)(e.img,{alt:"integration",src:s(6049).Z+"",width:"711",height:"441"})}),"\n",(0,n.jsx)(e.pre,{children:(0,n.jsx)(e.code,{className:"language-xml",metastring:'title="Junit xml"',children:'<?xml version="1.0" encoding="UTF-8"?>\r\n<testsuites time="15.682687">\r\n    <testsuite name="Tests.Registration" time="6.605871">\r\n        <testcase name="testCase1" classname="Tests.Registration" time="2.113871" />\r\n        <testcase name="testCase2" classname="Tests.Registration" time="1.051" />\r\n        <testcase name="testCase3" classname="Tests.Registration" time="3.441" />\r\n    </testsuite>\r\n    <testsuite name="Tests.Authentication" time="9.076816">\r\n        <testsuite name="Tests.Authentication.Login" time="4.356">\r\n            <testcase name="testCase4" classname="Tests.Authentication.Login" time="2.244" />\r\n            <testcase name="testCase5" classname="Tests.Authentication.Login" time="0.781" />\r\n            <testcase name="testCase6" classname="Tests.Authentication.Login" time="1.331" />\r\n        </testsuite>\r\n        <testcase name="testCase7" classname="Tests.Authentication" time="2.508" />\r\n        <testcase name="testCase8" classname="Tests.Authentication" time="1.230816" />\r\n        <testcase name="testCase9" classname="Tests.Authentication" time="0.982">\r\n            <failure message="Assertion error message" type="AssertionError">\r\n                \x3c!-- Call stack printed here --\x3e\r\n            </failure>\r\n        </testcase>\r\n    </testsuite>\r\n</testsuites>\n'})})]})}function u(t={}){const{wrapper:e}={...(0,a.a)(),...t.components};return e?(0,n.jsx)(e,{...t,children:(0,n.jsx)(l,{...t})}):l(t)}},6049:(t,e,s)=>{s.d(e,{Z:()=>n});const n=s.p+"assets/images/integration-10f35d84050960d642ad826930fd23a0.png"},1151:(t,e,s)=>{s.d(e,{Z:()=>o,a:()=>r});var n=s(7294);const a={},i=n.createContext(a);function r(t){const e=n.useContext(i);return n.useMemo((function(){return"function"==typeof t?t(e):{...e,...t}}),[e,t])}function o(t){let e;return e=t.disableParentContext?"function"==typeof t.components?t.components(a):t.components||a:r(t.components),n.createElement(i.Provider,{value:e},t.children)}}}]);