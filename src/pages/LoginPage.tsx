import { useState } from "react";
import type { FormEvent } from "react";
import { login } from "../services/authService";

type LoginPageProps = {
  onLoginSuccess: () => Promise<void>;
};

export default function LoginPage({
    onLoginSuccess
}: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
      event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setError("");

    try {
      await login(username, password);
      await onLoginSuccess();
    } catch (error) {
      setError(
          error instanceof Error
              ? error.message
              : "Failed to log in"
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
      <div className="login-page">
        <div className="login-page__card">
          <div className="login-page__brand">
            <div className="login-page__brand-icon">
              JKM
            </div>

            <h1>Administrator Login</h1>

            <p>
              Sign in to manage JKM applications.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-page__field">
              <label htmlFor="username">
                Username
              </label>

              <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                      setUsername(event.target.value)
                  }
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  disabled={isLoggingIn}
              />
            </div>

            <div className="login-page__field">
              <label htmlFor="password">
                Password
              </label>

              <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                      setPassword(event.target.value)
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  disabled={isLoggingIn}
              />
            </div>

            {error && (
                <div
                    className="login-page__error"
                    role="alert"
                >
                  {error}
                </div>
            )}

            <button
                type="submit"
                className="login-page__submit"
                disabled={isLoggingIn}
            >
              {isLoggingIn
                  ? "Logging In..."
                  : "Sign In"}
            </button>
          </form>

          <div className="login-page__docs">
            <div className="login-page__docs-content">
            <span className="login-page__docs-label">
              DEVELOPER RESOURCES
            </span>

              <h3>API Documentation</h3>

              <p>
                Explore the JKM Mock API endpoints,
                eligibility criteria, and integration
                guidelines for third-party applications.
              </p>
            </div>

            <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="login-page__docs-link"
            >
              View API Documentation

              <span aria-hidden="true">
              ↗
            </span>
            </a>
          </div>

          <div className="login-page__footer">
            For Academic Demonstration Only
          </div>
        </div>
      </div>
  );
}
