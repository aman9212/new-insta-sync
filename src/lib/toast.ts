export const toast = {
  success: (msg: string) => console.log('SUCCESS:', msg),
  error: (msg: string) => console.error('ERROR:', msg),
  warning: (msg: string) => console.warn('WARNING:', msg)
};

export function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  if (type === 'success') {
    toast.success(message);
  } else if (type === 'error') {
    toast.error(message);
  } else if (type === 'warning') {
    toast.warning(message);
  }
}
