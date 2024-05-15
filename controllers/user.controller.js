import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

export const getusers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({ users });
  } catch (error) {
    console.log(err);
    res.status(500).json({ message: "Failed to get users!" });
  }
};

export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    res.status(200).json({ user });
  } catch (error) {
    console.log(err);
    res.status(500).json({ message: "Failed to get user!" });
  }
};

export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserid = req.userId;
  const { password, avatar, ...inputs } = req.body;

  if (id !== tokenUserid) {
    return res.status(403).json({ message: "Not authorised!" });
  }

  let updatedPassword = null;
  try {
    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(updatedPassword && { password: updatedPassword }),
        ...(avatar && { avatar }),
      },
    });

    const { password: userPassword, ...rest } = updatedUser;

    res.status(200).json(rest);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to update user!" });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserid = req.userId;
  const { password, avatar, ...inputs } = req.body;

  if (id !== tokenUserid) {
    return res.status(403).json({ message: "Not authorised!" });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserid = req.userid;

  try {
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          user: tokenUserid,
          postId,
        },
      },
    });

    if (savedPost) {
      await prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
      res.status(200).json({ message: "Post removed from saved List" });
    } else {
      await prisma.savedPost.create({
        data: {
          user: tokenUserid,
          postId,
        },
      });
      res.status(200).json({ message: "Post saved " });
    }
  } catch (error) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete user!" });
  }
};

export const profilePosts = async (req, res) => {
  const tokenUserid = req.params.userId;
  try {
    const userPosts = await prisma.post.findMany({
      where: { userId: tokenUserid },
    });
    const saved = await prisma.savedPost.findMany({
      where: { userId: tokenUserid },
      include: {
        post: true,
      },
    });

    const savedPosts = saved.map((item) => item.post);
    res.status(200).json({ userPosts, savedPosts });
  } catch (error) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile Posts!" });
  }
};

export const getNotificationNumber = async (req, res) => {
  const tokenUserid = req.userId;
  try {
    const number = await prisma.chat.count({
      where: {
        userIDs: {
          has: [tokenUserid],
        },
        NOT: {
          seenBy: {
            hasSome: [tokenUserid],
          },
        },
      },
    });

    res.status(200).json(number);
  } catch (error) {
    console.log(err);
    res.status(500).json({ message: "Failed to get notifications!" });
  }
};
