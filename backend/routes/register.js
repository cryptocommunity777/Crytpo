// POST /api/login
router.post('/login', async (req, res) => {
  const { userId, password } = req.body;

  try {
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // In production, generate a token here. We'll just return user data for now.
    res.json({
      token: 'dummy-token',  // Replace with real JWT later
      userId: user.userId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      country: user.country,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});
