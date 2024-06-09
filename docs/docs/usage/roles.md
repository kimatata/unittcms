---
sidebar_position: 1
---

# Roles

There are two types of roles in UnitTCMS: "Global roles" and "Project roles".

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

| Action | Manager/Owner | Developer | Reporter | Not member |
| ------ | ------------- | --------- | -------- | ---------- |
| Delete | ✅            | ❌        | ❌       | ❌         |
| Update | ✅            | ❌        | ❌       | ❌         |
| Read   | ✅            | ✅        | ✅       | 🌓         |

#### Project Members

| Action      | Manager/Owner | Developer | Reporter | Not member |
| ----------- | ------------- | --------- | -------- | ---------- |
| Add         | ✅            | ❌        | ❌       | ❌         |
| Delete      | ✅            | ❌        | ❌       | ❌         |
| Change role | ✅            | ❌        | ❌       | ❌         |
| Read        | ✅            | ✅        | ✅       | 🌓         |

#### Folders and Test cases

| Action | Manager/Owner | Developer | Reporter | Not member |
| ------ | ------------- | --------- | -------- | ---------- |
| Create | ✅            | ✅        | ❌       | ❌         |
| Delete | ✅            | ✅        | ❌       | ❌         |
| Update | ✅            | ✅        | ❌       | ❌         |
| Read   | ✅            | ✅        | ✅       | 🌓         |

#### Test runs

| Action | Manager/Owner | Developer | Reporter | Not member |
| ------ | ------------- | --------- | -------- | ---------- |
| Create | ✅            | ✅        | ✅       | ❌         |
| Delete | ✅            | ✅        | ✅       | ❌         |
| Update | ✅            | ✅        | ✅       | ❌         |
| Read   | ✅            | ✅        | ✅       | 🌓         |

1. "Owner" and "Not member" are not role. "Owner" is the user who created project.
   "Not member" means a user who is not a project member
1. 🌓 means that read permission is only allowed if the project is set to public.
