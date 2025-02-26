import { useState, useEffect, useContext } from "react";
import { useAlert } from "@/context/AlertContext";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthContext from "@/context/AuthContext";
import api from "@/utils/api";

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MIN_LENGTH = 50;

export function TicketForm({ onSubmitSuccess }) {
  const { currentUser } = useContext(AuthContext);

  const { showAlert } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    const newErrors = { title: "", description: "" };

    if (formData.title.length > TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
    }

    if (
      formData.description.length > 0 &&
      formData.description.length < DESCRIPTION_MIN_LENGTH
    ) {
      newErrors.description = `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`;
    }

    setErrors(newErrors);
  }, [formData.title, formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.title.length > TITLE_MAX_LENGTH) {
      showAlert(
        `Title must be ${TITLE_MAX_LENGTH} characters or less`,
        "error"
      );
      return;
    }

    if (formData.description.length < DESCRIPTION_MIN_LENGTH) {
      showAlert(
        `Please provide a detailed description (at least ${DESCRIPTION_MIN_LENGTH} characters)`,
        "error"
      );
      return;
    }

    const cleanDescription = formData.description.trim();
    const repeatedCharsPattern = /(.)\1{9,}/;
    if (
      cleanDescription.length < DESCRIPTION_MIN_LENGTH ||
      repeatedCharsPattern.test(cleanDescription)
    ) {
      showAlert("Please provide a proper description of your issue", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/ticket/submit", {
        title: formData.title,
        description: formData.description,
        customerId: currentUser?.id,
      });

      if (response.data.message) {
        showAlert(response.data.message, "success");
      }

      onSubmitSuccess?.();

      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "medium",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create ticket. Please try again.";
      showAlert(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Support Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title</Label>
              <span
                className={`text-sm ${
                  formData.title.length > TITLE_MAX_LENGTH
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {formData.title.length}/{TITLE_MAX_LENGTH}
              </span>
            </div>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief description of the issue"
              className={errors.title ? "border-red-500" : ""}
              required
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <span
                className={`text-sm ${
                  formData.description.length < DESCRIPTION_MIN_LENGTH &&
                  formData.description.length > 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {formData.description.length} characters
                {formData.description.length < DESCRIPTION_MIN_LENGTH &&
                  formData.description.length > 0 &&
                  ` (minimum ${DESCRIPTION_MIN_LENGTH})`}
              </span>
            </div>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed explanation of your issue..."
              className={`min-h-[150px] ${
                errors.description ? "border-red-500" : ""
              }`}
              required
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting || Object.keys(errors).some((key) => errors[key])
            }
          >
            {isSubmitting ? "Creating..." : "Create Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

TicketForm.propTypes = {
  onSubmitSuccess: PropTypes.func,
};

export default TicketForm;
