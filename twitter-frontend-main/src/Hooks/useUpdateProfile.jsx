import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { mainApi } from "../utils/api";

const useUpdateProfile = (formdata) => {
    const queryClient = useQueryClient();

	const { mutateAsync: updateProfile, isPending: isupdating } = useMutation({
		mutationFn: async (formData) => {
			try {
				const res = await fetch(`${mainApi}api/users/update`, {
					method: "PUT",
					headers:{
						"Content-Type": "application/json",
						'auth-token': localStorage.getItem('token'),
					},
					body: JSON.stringify(formData),
				});
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				return data;
			} catch (error) {
				throw new Error(error.message);
			}
		},
		onSuccess: () => {
			toast.success("Profile updated successfully");
			Promise.all([
				queryClient.invalidateQueries({ queryKey: ["authUser"] }),
				queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
			]);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return { updateProfile, isupdating };
}

export default useUpdateProfile