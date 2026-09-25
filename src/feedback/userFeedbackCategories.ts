/** One choice in the feedback form's "Kind of feedback" select. */
export interface UserFeedbackCategoryOption {
  /** What gets stored and handed to `submitFeedback`. */
  value: string;
  /** What the reporter reads. */
  label: string;
}

/**
 * The categories offered by default, in the order they are shown.
 *
 * Plain-language labels: the submitter may be someone on a phone, not someone
 * who thinks in issue trackers. The upper-case value is what gets stored.
 */
export const DEFAULT_USER_FEEDBACK_CATEGORY_OPTIONS: UserFeedbackCategoryOption[] =
  [
    { value: "BUG", label: "Something is broken" },
    { value: "CONFUSING", label: "Something is confusing" },
    { value: "IDEA", label: "I have an idea" },
    { value: "PRAISE", label: "Something works well" },
    { value: "OTHER", label: "Something else" },
  ];
