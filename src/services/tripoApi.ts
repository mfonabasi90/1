// Tripo AI API Service
// Handles image upload → 3D model generation → model retrieval
// Uses /api/tripo proxy when running via server.js (avoids CORS)
// Falls back to direct API if proxy isn't available

const PROXY_BASE = '/api/tripo';
const DIRECT_BASE = 'https://api.tripo3d.ai/v2/openapi';

// Detect if proxy is available
let apiBase: string | null = null;

async function getApiBase(): Promise<string> {
  if (apiBase) return apiBase;
  
  // Try the proxy first (quick check)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch(`${PROXY_BASE}/wallet`, { 
      method: 'GET',
      headers: { 'Authorization': 'Bearer probe' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    // If we get any response (even 401), the proxy is working
    apiBase = PROXY_BASE;
    console.log('[TripoAPI] Using local proxy');
  } catch {
    // Proxy not available, use direct API
    apiBase = DIRECT_BASE;
    console.log('[TripoAPI] Proxy not available, using direct API (may have CORS issues)');
  }
  
  return apiBase;
}

export interface TripoTask {
  task_id: string;
  type: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'banned' | 'expired' | 'cancelled' | 'unknown';
  input: Record<string, any>;
  output: {
    model?: string;
    base_model?: string;
    pbr_model?: string;
    rendered_image?: string;
  };
  progress: number;
  consumed_credit?: number;
  create_time?: number;
}

export interface GenerationOptions {
  quality: 'draft' | 'standard' | 'high';
  autoRig: boolean;
  autoTexture: boolean;
  modelVersion?: string;
}

/**
 * Upload an image file to Tripo and get a file token
 */
export async function uploadImage(apiKey: string, file: File): Promise<string> {
  const base = await getApiBase();
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${base}/upload/sts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`Upload error: ${JSON.stringify(data)}`);
  }

  return data.data.image_token;
}

/**
 * Create an image-to-model generation task
 */
export async function createImageToModelTask(
  apiKey: string,
  fileToken: string,
  options: GenerationOptions
): Promise<string> {
  const base = await getApiBase();
  const modelVersion = options.modelVersion || 'v2.5-20250123';
  
  const body: Record<string, any> = {
    type: 'image_to_model',
    model_version: modelVersion,
    file: {
      type: 'png',
      file_token: fileToken,
    },
    texture: options.autoTexture,
    pbr: options.autoTexture,
  };

  // Set face limit based on quality
  if (options.quality === 'draft') {
    body.face_limit = 5000;
  } else if (options.quality === 'high') {
    body.face_limit = 200000;
    if (modelVersion >= 'v3.0') {
      body.geometry_quality = 'detailed';
    }
  }

  const response = await fetch(`${base}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Task creation failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`Task error: ${JSON.stringify(data)}`);
  }

  return data.data.task_id;
}

/**
 * Poll a task for its current status
 */
export async function getTaskStatus(apiKey: string, taskId: string): Promise<TripoTask> {
  const base = await getApiBase();
  
  const response = await fetch(`${base}/task/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Task status check failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`Task status error: ${JSON.stringify(data)}`);
  }

  return data.data;
}

/**
 * Poll until the task is complete (success/fail)
 */
export async function pollTaskUntilComplete(
  apiKey: string,
  taskId: string,
  onProgress?: (progress: number, status: string) => void,
  intervalMs: number = 2000
): Promise<TripoTask> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const task = await getTaskStatus(apiKey, taskId);
        
        if (onProgress) {
          onProgress(task.progress, task.status);
        }

        if (task.status === 'success') {
          resolve(task);
        } else if (task.status === 'failed' || task.status === 'banned' || task.status === 'expired' || task.status === 'cancelled') {
          reject(new Error(`Task ${task.status}: The generation failed. Please try again.`));
        } else {
          // Still running, poll again
          setTimeout(poll, intervalMs);
        }
      } catch (error: any) {
        reject(error);
      }
    };

    poll();
  });
}

/**
 * Full pipeline: upload image → generate model → return model URL
 */
export async function generate3DFromImage(
  apiKey: string,
  file: File,
  options: GenerationOptions,
  onProgress?: (progress: number, stage: string) => void
): Promise<{ modelUrl: string; renderedImage?: string; taskId: string }> {
  // Step 1: Upload image
  if (onProgress) onProgress(5, 'Uploading image to Tripo AI...');
  const fileToken = await uploadImage(apiKey, file);
  
  // Step 2: Create generation task
  if (onProgress) onProgress(10, 'Starting 3D generation...');
  const taskId = await createImageToModelTask(apiKey, fileToken, options);
  
  // Step 3: Poll until complete
  if (onProgress) onProgress(15, 'Generating 3D model...');
  const task = await pollTaskUntilComplete(
    apiKey,
    taskId,
    (progress, status) => {
      if (onProgress) {
        const totalProgress = 15 + (progress * 0.8);
        onProgress(totalProgress, status === 'running' ? 'Generating 3D mesh & textures...' : 'Waiting in queue...');
      }
    }
  );
  
  // Step 4: Get model URL
  if (!task.output.model) {
    throw new Error('Generation succeeded but no model URL was returned');
  }

  if (onProgress) onProgress(98, 'Model ready!');
  
  return {
    modelUrl: task.output.model,
    renderedImage: task.output.rendered_image,
    taskId,
  };
}
