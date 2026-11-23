import { useState } from "react";
import ApplicationDetails from "../components/applications/ApplicationDetails";
import StatusModal from "../components/ui/StatusModal";
import type {
  Application,
  ApplicationStatus,
} from "../types/applications";

type ApplicationDetailsPageProps = {
  application: Application;
  onBack: () => void;
  onUpdateStatus: (
      applicationId: string,
      status: ApplicationStatus
  ) => Promise<void>;
};

export default function ApplicationDetailsPage({
    application,
    onBack,
    onUpdateStatus
}: ApplicationDetailsPageProps) {
  const [isStatusModalOpen, setIsStatusModalOpen] =
      useState(false);

  const handleOpenModal = () => {
    setIsStatusModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsStatusModalOpen(false);
  };

  return (
      <div className="application-details-page">
        <ApplicationDetails
            key={application.id}
            application={application}
            onBack={onBack}
            onUpdateStatus={handleOpenModal}
        />

        {isStatusModalOpen && (
            <StatusModal
                key={application.id}
                application={application}
                onClose={handleCloseModal}
                onUpdateStatus={onUpdateStatus}
            />
        )}
      </div>
  );
}
