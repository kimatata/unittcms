import { randomBytes } from 'node:crypto';
import { memberRoles } from '../users/authSettings.js';

/** Deux semaines : assez pour relancer quelqu'un, trop court pour traîner. */
export const INVITATION_LIFETIME_DAYS = 14;

export const isUsable = (invitation) =>
  invitation && !invitation.acceptedAt && new Date(invitation.expiresAt).getTime() > Date.now();

export const newToken = () => randomBytes(32).toString('hex');

export const expiryFromNow = () => new Date(Date.now() + INVITATION_LIFETIME_DAYS * 24 * 60 * 60 * 1000);

export const isMemberRole = (role) => Number.isInteger(role) && Boolean(memberRoles[role]);

/** Ce qu'un invité peut lire sans être connecté : de quoi décider, rien de plus. */
export const toPreview = (invitation, projectName) => ({
  projectName,
  role: invitation.role,
  email: invitation.email,
  expiresAt: invitation.expiresAt,
});
