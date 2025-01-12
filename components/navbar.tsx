import { MobileSidebar } from "@/components/mobile-sidebar";
import { UserMenu } from "@/components/user-menu";
import { getApiLimitCount } from "@/lib/api-limit";

const Navbar = async () => {
  const apiLimitCount = await getApiLimitCount();
  const isPro = false;

  return (
    <div className="flex items-center p-4">
      <MobileSidebar isPro={isPro} apiLimitCount={apiLimitCount} />
      <div className="flex w-full justify-end">
        <UserMenu />
      </div>
    </div>
  );
}

export default Navbar;
