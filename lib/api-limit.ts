import supabase from "@/lib/supabase";
import { MAX_FREE_COUNTS } from "@/constants";

export const incrementApiLimit = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return;
  }

  const { data: userApiLimit } = await supabase
    .from('user_api_limits')
    .select()
    .eq('user_id', user.id)
    .single();

  if (userApiLimit) {
    await supabase
      .from('user_api_limits')
      .update({ count: userApiLimit.count + 1 })
      .eq('user_id', user.id);
  } else {
    await supabase
      .from('user_api_limits')
      .insert([
        { user_id: user.id, count: 1 }
      ]);
  }
};

export const checkApiLimit = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return false;
  }

  const { data: userApiLimit } = await supabase
    .from('user_api_limits')
    .select()
    .eq('user_id', user.id)
    .single();

  if (!userApiLimit || userApiLimit.count < MAX_FREE_COUNTS) {
    return true;
  } else {
    return false;
  }
};

export const getApiLimitCount = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    return 0;
  }

  const { data: userApiLimit } = await supabase
    .from('user_api_limits')
    .select()
    .eq('user_id', user.id)
    .single();

  if (!userApiLimit) {
    return 0;
  }

  return userApiLimit.count;
};
