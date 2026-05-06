import { useAuth } from "@clerk/tanstack-react-start";
import { useEffect, useState } from "react";

export function useIsAdmin() {
	const { isSignedIn } = useAuth();
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		if (isSignedIn !== true) {
			setIsAdmin(false);
			return;
		}
		fetch("/api/admin/check")
			.then((res) => res.json() as Promise<{ isAdmin: boolean }>)
			.then((data) => setIsAdmin(data.isAdmin))
			.catch(() => setIsAdmin(false));
	}, [isSignedIn]);

	return isAdmin;
}
