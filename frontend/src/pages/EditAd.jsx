import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMyAdById, submitEditRequest } from '../api/ads';
import { useCategories } from '../hooks/useCategories';
import Alert from '../components/Alert';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import StepIndicator from '../components/post-ad/StepIndicator';
import StepDetails from '../components/post-ad/StepDetails';
import StepCategoryContact from '../components/post-ad/StepCategoryContact';
import StepImages from '../components/post-ad/StepImages';
import StepReview from '../components/post-ad/StepReview';
import { getErrorMessage, getFieldErrors } from '../utils/errors';

// Kept in sync with the backend's multer limits (max 3 images, 400KB each) —
// same constants PostAd.jsx uses, just duplicated here since the two pages
// don't currently share a form-state module.
const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE_BYTES = 400 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const STEPS = ['Details', 'Category & Contact', 'Images', 'Review'];
// Exact strings reused verbatim from the backend's own validation messages so
// users see identical wording whether the client or server catches the issue.
const OVERSIZE_IMAGE_MESSAGE = 'රූපයේ ප්‍රමාණය 400kb ට වඩා අඩුවෙන් උඩුගත කරන්න.';
const TOO_MANY_IMAGES_MESSAGE = 'උපරිම ඡායාරූප 3ක් උඩුගත කළ හැක. (Maximum 3 images allowed.)';
const EDIT_SUBMIT_NOTE =
  'ඔබගේ දැන්වීම දැනට පළ වී ඇති බැවින්, මෙම වෙනස්කම් පළ කිරීමට පෙර පරිපාලක අනුමැතිය අවශ්‍ය වේ. (Since your ad is already live, these changes need admin approval before they show publicly.)';
const EDIT_SUCCESS_MESSAGE = 'ඔබගේ වෙනස්කම් සමාලෝචනය සඳහා යවා ඇත';

export default function EditAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories } = useCategories();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    whatsappNumber: '',
    telegramUsername: '',
    city: '',
  });
  // Image paths already on the ad, kept unless the owner removes them.
  const [existingImages, setExistingImages] = useState([]);
  // Newly picked files — same `{file, preview}` shape PostAd.jsx uses.
  const [newImages, setNewImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    fetchMyAdById(id)
      .then((data) => {
        if (!active) return;
        const ad = data.ad;
        setForm({
          title: ad.title || '',
          description: ad.description || '',
          category: ad.category?._id || '',
          whatsappNumber: ad.whatsappNumber || '',
          telegramUsername: ad.telegramUsername || '',
          city: ad.city || '',
        });
        setExistingImages(ad.images || []);
      })
      .catch((err) => {
        if (active) setLoadError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const showToast = (message) => {
    setToast({ id: Date.now(), message });
  };

  const addImages = (fileList) => {
    setImageError('');
    const incoming = Array.from(fileList);
    const combined = [...newImages];

    for (const file of incoming) {
      if (existingImages.length + combined.length >= MAX_IMAGES) {
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

    setNewImages(combined);
  };

  const removeImage = (index) => {
    setNewImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  const removeExistingImage = (imagePath) => {
    setExistingImages((prev) => prev.filter((img) => img !== imagePath));
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
      formData.append('existingImages', JSON.stringify(existingImages));
      newImages.forEach((image) => formData.append('images', image.file));

      await submitEditRequest(id, formData);
      // Show the confirmation toast briefly before navigating away — an
      // immediate navigate() would unmount this page (and the toast with
      // it) before the user ever sees it.
      showToast(EDIT_SUCCESS_MESSAGE);
      setTimeout(() => navigate('/my-ads'), 1500);
      return;
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(Object.fromEntries(getFieldErrors(err).map((fe) => [fe.field, fe.message])));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert variant="error">{loadError}</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-4">
      <div>
        <h1 className="text-xl font-bold text-ink">Edit Ad</h1>
        <p className="text-sm text-gray-500">ඔබගේ දැන්වීම යාවත්කාලීන කරන්න.</p>
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
          images={newImages}
          onAdd={addImages}
          onRemove={removeImage}
          error={imageError}
          maxImages={MAX_IMAGES}
          existingImages={existingImages}
          onRemoveExisting={removeExistingImage}
        />
      )}
      {step === 4 && (
        <StepReview
          form={form}
          images={newImages}
          categories={categories}
          adLevels={[]}
          submitNote={EDIT_SUBMIT_NOTE}
        />
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
            {submitting ? 'Submitting...' : 'Submit Changes'}
          </button>
        )}
      </div>

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.message === EDIT_SUCCESS_MESSAGE ? 'success' : 'error'}
          onClose={() => setToast(null)}
          bottomClassName="bottom-24 sm:bottom-4"
        />
      )}
    </div>
  );
}
