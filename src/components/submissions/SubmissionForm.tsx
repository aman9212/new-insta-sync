import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { createSubmission } from "../../services/submission.service";
import type { SocialPlatform } from "../../types";

export function SubmissionForm({
  campaignId,
  platforms,
  onSubmitted,
}: {
  campaignId: string;
  platforms: SocialPlatform[];
  onSubmitted?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setLoading(true);
    setError(null);
    try {
      await createSubmission(
        campaignId,
        String(form.get("platform")) as SocialPlatform,
        String(form.get("postUrl"))
      );
      formElement.reset();
      onSubmitted?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-text-primary">Submit a post</h2>
      <div className="mt-4 grid gap-4">
        <Select
          label="Platform"
          name="platform"
          required
          options={platforms.map((platform) => ({ value: platform, label: platform }))}
        />
        <Input
          label="Public post URL"
          name="postUrl"
          type="url"
          required
          placeholder="https://..."
        />
      </div>
      {error && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}
      <Button className="mt-4 w-full" loading={loading}>
        Submit for processing
      </Button>
    </form>
  );
}
