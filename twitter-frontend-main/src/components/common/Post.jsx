import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { GoBookmarkFill } from "react-icons/go";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "./LoadingSpinner.jsx"
import { AiFillHeart } from "react-icons/ai";
import { formatPostDate } from "../../utils/date/index.js";
import { mainApi } from "../../utils/api.js";
import useBookmark from "../../Hooks/useBookmark.jsx";
import useRetweet from "../../Hooks/useRetweet.jsx";

const Post = ({ post }) => {
	const [comment, setComment] = useState("");
	const{data:authUser}=useQuery({queryKey:["authUser"]});
	
	const queryClient = useQueryClient();
	{/* Delete Functionality*/ }
	const {mutate:deletePost,isPending,} = useMutation({
		mutationFn:async()=>{
			try {
				const res = await fetch(`${mainApi}api/post/delete/${post._id}`,{
					method:"DELETE",
					headers:{"Content-Type": "application/json"
						,"auth-token":localStorage.getItem("token"),
					},

				});
				const data = res.json();
				if(!res.ok) throw new Error(data.error || "Something went wrong");
				return data;
			} catch (error) {
				throw new Error(error);
			}
		},
		onSuccess:()=>{
			toast.success("Successfully Deleted");
			queryClient.invalidateQueries({queryKey:["posts"]});

		},
	})

	{/* Liking Functionality*/}
	const {mutate:like, isPending:isLiking} = useMutation({
		mutationFn:async () =>{
			try {
				const res = await fetch(`${mainApi}api/post/like/${post._id}`,{
					method:"GET",
					headers:{
						"Content-Type": "application/json"
						,"auth-token":localStorage.getItem("token"),
					}
				});
				const data = await res.json();
				if(!res.ok) throw new Error(data.error);
				const {updateLikes} = data;
				console.log(updateLikes);
				return updateLikes;
			} catch (error) {
				throw new Error(error.message);
			}
		},
		onSuccess: (updateLikes) => {
			
		
			queryClient.setQueryData(["posts"], (oldData) => {
				return oldData.map((p) => {
					if (p._id === post._id) {
						return { ...p, likes: updateLikes };
					}
					return p;
				});
			});
		},
		onError:(error)=>{
			toast.error(error.message);
		},
	})

	// comment Functionality
const {mutate:CommentPost,isPending:isCommenting}  = useMutation({
	mutationFn:async ()=>{
		try {
			const res = await fetch(`${mainApi}api/post/comment/${post._id}`,{
				method: 'POST',
				headers:{
					"Content-Type": "application/json",
					"auth-token":localStorage.getItem("token"),
				},
				body: JSON.stringify({text:comment})
			});
			const data = await res.json();
			if(!res.ok) throw new Error(data.error || "Something went wrong");
			return data;


		} catch (error) {
			throw new Error(error.message);
		}
	},
	onSuccess:()=>{
		toast.success("Comment posted successfully");
			setComment("");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
	},
	onError:()=>{
		toast.error(error.message);
	}
})
const {savePosts,isPending:issavePosting} = useBookmark();

	const postOwner = post?.user;
	const isLiked = post?.likes.includes(authUser?._id);
	const {isRetweeting,Retweet} = useRetweet();

	const isMyPost = authUser?._id === post?.user?._id;
	const checkbookmark = authUser?.savePosts?.includes(post?._id);

	const formattedDate = formatPostDate(post?.createdAt);

	
	const handleBookmark = (userId) =>{
		if(issavePosting) return;
		savePosts(userId);
	}
	const handleDeletePost = () => {
		deletePost();
	};
	const handleRetweet = (postId) =>{
		if(isRetweeting) return;

		Retweet(postId);
		
	}
	const handlePostComment = (e) => {
		e.preventDefault();
		if(isCommenting) return;
		CommentPost(comment);
	};

	const handleLikePost = () => {
		if(isLiking) return;
		like();
	};

	return (
		<>
			<div className='flex gap-2 items-start p-4 border-b border-gray-700'>
				<div className='avatar'>
					<Link to={`/profile/${postOwner?._id}`} className='w-8 rounded-full overflow-hidden'>
						<img src={postOwner?.profileImg || "/avatar-placeholder.png"} />
					</Link>
				</div>
				<div className='flex flex-col flex-1'>
					<div className='flex gap-2 items-center'>
						<Link to={`/profile/${postOwner?._id}`} className='font-bold'>
							{postOwner?.fullName}
						</Link>
						<span className='text-gray-700 flex gap-1 text-sm'>
							<Link to={`/profile/${postOwner?._id}`}>@{postOwner?.username}</Link>
							<span>·</span>
							<span>{formattedDate}</span>
						</span>
						{isMyPost&& (
							<span className='flex justify-end flex-1'>
								{!isPending &&(

								<FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
								)}
								{isPending&&(
								<LoadingSpinner size="sm"/>
								)}
							</span>
						)}
					</div>
					<div className='flex flex-col gap-3 overflow-hidden'>
						<span>{post?.text}</span>
						{post?.img && (
							<img
								src={post?.img}
								className='h-80 object-contain rounded-lg border border-gray-700'
								alt=''
							/>
						)}
					</div>
					<div className='flex justify-between mt-3'>
						<div className='flex gap-4 items-center w-2/3 justify-between'>
							<div
								className='flex gap-1 items-center cursor-pointer group'
								onClick={() => document.getElementById("comments_modal" + post?._id).showModal()}
							>
								<FaRegComment className='w-4 h-4  text-slate-500 group-hover:text-sky-400' />
								<span className='text-sm text-slate-500 group-hover:text-sky-400'>
									{post.comments.length}
								</span>
							</div>
							{/* We're using Modal Component from DaisyUI */}
							<dialog id={`comments_modal${post?._id}`} className='modal border-none outline-none'>
								<div className='modal-box rounded border border-gray-600'>
									<h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
									<div className='flex flex-col gap-3 max-h-60 overflow-auto'>
										{post.comments.length === 0 && (
											<p className='text-sm text-slate-500'>
												No comments yet 🤔 Be the first one 😉
											</p>
										)}
										{post.comments.map((comment) => (
											<div key={comment?._id} className='flex gap-2 items-start'>
												<div className='avatar'>
													<div className='w-8 rounded-full'>
														<img
															src={comment?.user?.profileImg || "/avatar-placeholder.png"}
														/>
													</div>
												</div>
												<div className='flex flex-col'>
													<div className='flex items-center gap-1'>
														<span className='font-bold'>{comment?.user?.fullName}</span>
														<span className='text-gray-700 text-sm'>
															@{comment?.user?.username}
														</span>
													</div>
													<div className='text-sm'>{comment?.text}</div>
												</div>
											</div>
										))}
									</div>
									<form
										className='flex gap-2 items-center mt-4 border-t border-gray-600 pt-2'
										onSubmit={handlePostComment}
									>
										<textarea
											className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800'
											placeholder='Add a comment...'
											value={comment}
											onChange={(e) => setComment(e.target.value)}
										/>
										<button className='btn btn-primary rounded-full btn-sm text-white px-4'>
											{isCommenting ? (
												<span className='loading loading-spinner loading-md'></span>
											) : (
												"Post"
											)}
										</button>
									</form>
								</div>
								<form method='dialog' className='modal-backdrop'>
									<button className='outline-none'>close</button>
								</form>
							</dialog>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={()=>handleRetweet(post?._id)}>
							{isRetweeting && <LoadingSpinner size="sm"/>}
							{	!isRetweeting && <BiRepost className={`w-6 h-6   group-hover:text-green-500 text-slate-500 `} />}
								<span className='text-sm text-slate-500 group-hover:text-green-500'>{post?.TotalRetweet}</span>
							</div>
							<div className='flex gap-1 items-center group cursor-pointer' onClick={handleLikePost}>
								{isLiking && <LoadingSpinner size="sm"/>}
								{!isLiked && !isLiking && (
									<FaRegHeart className='w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500' />
								)}
								{isLiked &&!isLiking && <AiFillHeart className="w-4 h-4 cursor-pointer text-pink-500" fill={isLiked?"rgb(236 72 153)":""}/>}

								<span
									className={`text-sm text-slate-500 group-hover:text-pink-500 ${
										isLiked ? "text-pink-500 fill-pink-500" : ""
									}`}
								>
									{post.likes.length}
								</span>
							</div>
						</div>
						<div className='flex w-1/3 justify-end gap-2 items-center' onClick={()=>handleBookmark(post?._id)}>
						{issavePosting && <LoadingSpinner size="sm"/>}
						{
							!issavePosting && checkbookmark && <GoBookmarkFill className='w-4 h-4 text-slate-500 cursor-pointer' fill="rgb(29, 155, 240)"/>
						}
						{
							!issavePosting && !checkbookmark && <FaRegBookmark className='w-4 h-4 text-slate-500 cursor-pointer'/>
						}
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
export default Post;