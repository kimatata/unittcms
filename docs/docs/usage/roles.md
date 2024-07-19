---
sidebar_position: 1
---

# Roles

There are "Global roles," which are site-wide roles, and "project roles" which are project-specific roles.

## Global roles

This role is tied to each user's information and affects the entire site, regardless of the project.
There are two types of roles:

- Administrator
- User

Administrators can manage site-wide settings and users from the “Administration” menu.

## Project roles

This role can be set for members participating in each project.
There are three types of roles:

- Manager
- Developer
- Reporter

### Permissions for each role

#### Project

| Action | Owner[^1] | Manager | Developer | Reporter | Not member[^2] |
| ------ | --------- | ------- | --------- | -------- | -------------- |
| Write  | ✅        | ❌      | ❌        | ❌       | ❌             |
| Read   | ✅        | ✅      | ✅        | ✅       | 🌓[^3]         |

#### Project Members

| Action | Owner | Manager | Developer | Reporter | Not member |
| ------ | ----- | ------- | --------- | -------- | ---------- |
| Write  | ✅    | ✅      | ❌        | ❌       | ❌         |
| Read   | ✅    | ✅      | ✅        | ✅       | 🌓         |

#### Folders and Test cases

| Action | Owner | Owner | Developer | Reporter | Not member |
| ------ | ----- | ----- | --------- | -------- | ---------- |
| Write  | ✅    | ✅    | ✅        | ❌       | ❌         |
| Read   | ✅    | ✅    | ✅        | ✅       | 🌓         |

#### Test runs

| Action | Owner | Manager | Developer | Reporter | Not member |
| ------ | ----- | ------- | --------- | -------- | ---------- |
| Write  | ✅    | ✅      | ✅        | ✅       | ❌         |
| Read   | ✅    | ✅      | ✅        | ✅       | 🌓         |

[^1]: "Owner" is not role. "Owner" is the user who created project.
[^2]: "Not member" is not role. "Not member" means a user who is not a project member
[^3]: 🌓 means that read permission is only allowed if the project is set to public.
