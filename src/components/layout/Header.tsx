type HeaderProps = {
  adminUsername: string;
  onLogout: () => void;
  isLoggingOut: boolean;
};

const buildTime = import.meta.env.VITE_BUILD_TIME;

const formatDeploymentTime = (value: string | undefined) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function Header({
    adminUsername,
    onLogout,
    isLoggingOut
}: HeaderProps) {
  return (
      <header className="header">
        <div className="header__brand">
          <div className="header__brand-icon">
            JKM
          </div>

          <div className="header__brand-info">
            <h1>JKM Mock System</h1>
            <span>Administration Portal</span>
          </div>
        </div>

        <div className="header__admin">
          <div className="header__deployment">
                    <span className="header__deployment-label">
                        Last Deployed
                    </span>

            <span className="header__deployment-time">
                        {formatDeploymentTime(buildTime)}
                    </span>
          </div>

          <div className="header__avatar">
            {adminUsername.charAt(0).toUpperCase()}
          </div>

          <div className="header__admin-info">
            <span className="header__admin-name">
              {adminUsername}
            </span>

            <span className="header__admin-role">
              System Admin
            </span>
          </div>

          <button
              type="button"
              className="header__logout"
              onClick={onLogout}
              disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging Out..." : "Logout"}
          </button>
        </div>
      </header>
  );
}
