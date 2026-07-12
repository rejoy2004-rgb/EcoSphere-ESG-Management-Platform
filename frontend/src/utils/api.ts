interface RequestOptions extends RequestInit {
  body?: any;
}

export async function apiRequest(path: string, options: RequestOptions = {}) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let role = '';
  if (userStr) {
    try {
      role = JSON.parse(userStr).role;
    } catch {}
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (role) {
    headers['x-user-role'] = role;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers
  };

  if (options.body && !(options.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(path, fetchOptions);
    if (!res.ok) {
      let errorMessage = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {}
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'error', message: errorMessage }
        })
      );
      throw new Error(errorMessage);
    }
    if (res.status === 204) {
      return null;
    }
    return await res.json();
  } catch (err: any) {
    if (!err.message?.includes('HTTP error')) {
      window.dispatchEvent(
        new CustomEvent('toast-notification', {
          detail: { type: 'error', message: err.message || 'Network connection error' }
        })
      );
    }
    throw err;
  }
}
