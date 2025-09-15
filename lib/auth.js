import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password) => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hashedPassword) => {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
};
