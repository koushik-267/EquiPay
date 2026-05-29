import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query, ...args) => {
	const res = useQuery(query, ...args);
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	useEffect(() => {
		if (res === undefined) {
			setLoading(true);
		} else {
			try {
				setData(res);
				setError(null);
			} catch (err) {
				setError(err);
				toast.error(
					err.message || "An error occurred while fetching data.",
				);
			} finally {
				setLoading(false);
			}
		}
	}, [res]);

	return { data, loading, error };
};

export const useConvexMutation = (mutation) => {
	const mutationFn = useMutation(mutation);
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const mutate = async (...args) => {
		setLoading(true);
		setError(null);
		try {
			const response = await mutationFn(...args);
			setData(response);
			return response;
		} catch (err) {
			setError(err);
			toast.error(
				err.message ||
					"An error occurred while performing the mutation.",
			);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return { mutate, data, loading, error };
};
