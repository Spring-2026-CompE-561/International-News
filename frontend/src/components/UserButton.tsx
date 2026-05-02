import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

function UserButton() {
	return (
		<Button
			variant="ghost"
			size="icon"
		>
			<User />
		</Button>
	);
}

export default UserButton;
