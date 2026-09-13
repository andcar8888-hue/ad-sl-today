import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAd } from '../api/ads';
import { useCategories } from '../hooks/useCategories';
import { useAdLevels } from '../hooks/useAdLevels';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import Toast from '../components/Toast';
import StepIndicator from '../components/post-ad/StepIndicator';
import StepDetails from '../components/post-ad/StepDetails';
import StepCategoryContact from '../components/post-ad/StepCategoryContact';
import StepImages from '../components/post-ad/StepImages';
import StepAdLevel from '../components/post-ad/StepAdLevel';
import StepReview from '../components/post-ad/StepReview';
import { getErrorMessage, getFieldErrors } from '../utils/errors';

// Kept in sync with the backend's multer limits (max 3 images, 400KB each).
const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE_BYTES = 400 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const STEPS = ['Details', 'Category & Contact', 'Images', 'Ad Level', 'Review'];
// Exact strings reused verbatim from the backend's own validation messages so
// users see identical wording whether the client or server catches the issue.
const OVERSIZE_IMAGE_MESSAGE = 'රූපයේ ප්‍රමාණය 400kb ට වඩා අඩුවෙන් උඩුගත කරන්න.';
const TOO_MANY_IMAGES_MESSAGE = 'උපරිම ඡායාරූප 3ක් උඩුගත කළ හැක. (Maximum 3 images allowed.)';

export default function PostAd() {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { adLevels } = useAdLevels();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  // whatsappNumber/telegramUsername are seeded from the logged-in user's
  // profile defaults (if set) as a convenience — the user can still freely
  // edit these per-ad, this only changes the initial pre-filled value.
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    whatsappNumber: user?.whatsappNumber || '',
    telegramUsername: user?.telegramUsername || '',
    city: '',
    adLevel: '',
  });
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // { id, message } — `id` changes on every toast so re-triggering the same
  // message (e.g. picking another oversize photo) always restarts the timer.
  const [toast, setToast] = useState(null);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const showToast = (message) => {
    setToast({ id: Date.now(), message });
  };

  const addImages = (fileList) => {
    setImageError('');
    const incoming = Array.from(fileList);
    const combined = [...images];

    for (const file of incoming) {
      if (combined.length >= MAX_IMAGES) {
        setImageError(TOO_MANY_IMAGES_MESSAGE);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setImageError('Only JPEG, PNG, WEBP or GIF images are allowed.');
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setImageError(OVERSIZE_IMAGE_MESSAGE);
        showToast(OVERSIZE_IMAGE_MESSAGE);
        continue;
      }
      combined.push({ file, preview: URL.createObjectURL(file) });
    }

    setImages(combined);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  const validateStep = (current) => {
    if (current === 1) {
      if (!form.title.trim()) return 'Title is required.';
      if (form.title.length > 120) return 'Title cannot exceed 120 characters.';
      if (!form.description.trim()) return 'Description is required.';
      if (form.description.length > 5000) return 'Description cannot exceed 5000 characters.';
    }
    if (current === 2) {
      if (!form.category) return 'Please select a category.';
      if (!form.whatsappNumber.trim()) return 'WhatsApp number is required.';
      if (form.whatsappNumber.replace(/\D/g, '').length < 9) {
        return 'Please enter a valid WhatsApp number.';
      }
    }
    if (current === 4) {
      if (!form.adLevel) return 'Please select an ad level.';
    }
    return '';
  };

  const goNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep((current) => Math.min(current + 1, STEPS.length));
  };

  const goBack = () => {
    setError('');
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setFieldErrors({});
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('whatsappNumber', form.whatsappNumber.trim());
      if (form.telegramUsername.trim()) {
        formData.append('telegramUsername', form.telegramUsername.trim());
      }
      if (form.city.trim()) {
        formData.append('city', form.city.trim());
      }
      formData.append('category', form.category);
      formData.append('adLevel', form.adLevel);
      images.forEach((image) => formData.append('images', image.file));

      const data = await createAd(formData);
      // Post Ad -> Checkout is automatic per the platform flow; the Checkout
      // page itself starts the checkout order on mount.
      navigate(`/checkout/${data.ad._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(Object.fromEntries(getFieldErrors(err).map((fe) => [fe.field, fe.message])));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-bold text-ink">Post an Ad</h1>
        <p className="text-sm text-gray-500">ඔබගේ දැන්වීම විනාඩි කිහිපයකින් පළ කරන්න.</p>
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {step === 1 && <StepDetails form={form} updateField={updateField} fieldErrors={fieldErrors} />}
      {step === 2 && (
        <StepCategoryContact
          form={form}
          updateField={updateField}
          categories={categories}
          fieldErrors={fieldErrors}
        />
      )}
      {step === 3 && (
        <StepImages
          images={images}
          onAdd={addImages}
          onRemove={removeImage}
          error={imageError}
          maxImages={MAX_IMAGES}
        />
      )}
      {step === 4 && (
        <StepAdLevel
          form={form}
          updateField={updateField}
          adLevels={adLevels}
          fieldErrors={fieldErrors}
        />
      )}
      {step === 5 && (
        <StepReview form={form} images={images} categories={categories} adLevels={adLevels} />
      )}

      <div className="sticky bottom-0 -mx-4 flex justify-between gap-3 border-t border-border bg-surface-muted/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        {step > 1 ? (
          <button type="button" onClick={goBack} className="btn-secondary">
            Back
          </button>
        ) : (
          <span />
        )}

        {step < STEPS.length ? (
          <button type="button" onClick={goNext} className="btn-primary ml-auto">
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary ml-auto min-w-32"
          >
            {submitting ? 'Submitting...' : 'Submit Ad'}
          </button>
        )}
      </div>

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          variant="error"
          onClose={() => setToast(null)}
          // The step bar below is `sticky bottom-0` and only becomes static
          // (out of the way) from `sm` up, so only mobile needs the taller
          // offset to clear it.
          bottomClassName="bottom-24 sm:bottom-4"
        />
      )}
    </div>
  );
}
