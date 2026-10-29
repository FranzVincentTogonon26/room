export type UserNameFields = {
  firstName?: string | null;
  fullName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
};

function nameFromEmail(email: string): string {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The name to show for the signed-in guest. Clerk's first name wins, then the
 * full name, then a readable version of the email local part.
 */
export function displayNameFor(user?: UserNameFields | null): string {
  if (!user) return "Guest";

  if (user.firstName?.trim()) return user.firstName.trim();
  if (user.fullName?.trim()) return user.fullName.trim();

  const email = user.primaryEmailAddress?.emailAddress;
  if (email) {
    const name = nameFromEmail(email);
    if (name) return name;
  }

  return "Guest";
}

export function firstNameFor(user?: UserNameFields | null): string {
  const first = displayNameFor(user).split(/\s+/)[0];
  return first && first !== "Guest" ? first : "there";
}
