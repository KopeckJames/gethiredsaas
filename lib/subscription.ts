// Temporary subscription bypass - all users are pro
export async function checkSubscription() {
  return true;
}

export async function getUserSubscription() {
  return { isPro: true };
}
