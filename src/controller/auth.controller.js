import bcryptjs from "bcryptjs";
import { User } from "../models/auth.model.js";
import { github, lucia } from "../index.js";
import { generateState } from "arctic";

export const signup = async (req, res) => {
  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    username == null ||
    username == undefined ||
    username.length < 3 ||
    username.length > 20
  ) {
    return res
      .status(400)
      .json({ error: "Username must be between 3 and 20 characters" });
  }

  if (
    typeof password !== "string" ||
    password == null ||
    password == undefined ||
    password.length < 8
  ) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  const hashedPassword = await bcryptjs.hash(password, 10);

  try {
    const user = await User.create({
      username,
      password: hashedPassword,
    });

    const session = await lucia.createSession(user._id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return res
      .cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      .status(201)
      .json({ user: user.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: `Server Error: ${error}` });
  }
};

export const signin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const validUser = await User.findOne({ username });
    if (!validUser)
      return res.status(400).json({ error: "No such user. Please Signup." });

    const isValidPassword = bcryptjs.compareSync(password, validUser.password);
    if (!isValidPassword)
      return res.status(400).json({ error: " Incorrect password. Try again." });

    const session = await lucia.createSession(validUser._id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return res
      .cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      .status(201)
      .json({ user: validUser.toJSON() });
  } catch (error) {
    return res.status(500).json({ error: `Server Error: ${error}` });
  }
};

export const signout = async (req, res) => {
  try {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");

    if (!sessionId) {
      res.locals.session = nul;
      res.locals.user = null;

      return res.status(401).json({ error: "Unauthorized" });
    }

    const { session, user } = await lucia.validateSession(sessionId);

    await lucia.invalidateUserSessions(res.locals.user.id);

    const sessionCookie = lucia.createBlankSessionCookie();

    return res
      .cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      .status(204)
      .json("user logged out!");
  } catch (error) {
    return res.status(500).json({ error: `Server Error: ${error}` });
  }
};

export const gitSignIn = async (req, res) => {
  try {
    const state = generateState();
    const url = await github.createAuthorizationURL(state, {});

    return res
      .cookie("github_oauth_state", state, {
        path: "/",
        secure: false,
        httpOnly: true,
        maxAge: 60 * 10,
      })
      .redirect(url.toString());
  } catch (error) {
    console.log(error);
  }
};

export const gitCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const storedState = req.cookies["github_oauth_state"] ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    return res.status(400);
  }

  try {
    const token = await github.validateAuthorizationCode(code);
    const gihubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    const githubUser = await gihubUserResponse.json();

    const existingUser = await User.findOne({
      github_id: githubUser.id,
    }).exec();

    if (existingUser) {
      const session = await lucia.createSession(existingUser._id, {});
      const sessionCookie = lucia.createBlankSessionCookie(session.id);

      return res
        .cookie(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes
        )
        .status(200)
        .json(existingUser);
    }
    const newUser = await User.create({
      username: githubUser.login,
      github_id: githubUser.id,
    });

    const session = await lucia.createSession(newUser._id, {});
    const sessionCookie = lucia.createBlankSessionCookie(session.id);

    return res
      .cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      .status(201)
      .json(newUser);
  } catch (e) {
    // the specific error message depends on the provider
    if (e instanceof OAuth2RequestError) {
      // invalid code
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
};
