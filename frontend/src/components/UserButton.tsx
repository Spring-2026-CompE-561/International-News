import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

function UserButton() {
	return (
		<Button
			variant="ghost"
			size="icon"
			className="group w-auto px-2 overflow-hidden"
		>
			<User className="size-4 shrink-0" />
			<span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 opacity-0 text-sm font-medium group-hover:max-w-[60px] group-hover:pl-1.5 group-hover:opacity-100 transition-all duration-200">
				Account
			</span>
		</Button>
	);
}

export default UserButton;
