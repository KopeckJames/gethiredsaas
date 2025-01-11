import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const UserAvatar = () => {
  const { user } = useAuth();
  
  // Get initials from email if name not available
  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user?.user_metadata?.avatar_url} />
      <AvatarFallback>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};
