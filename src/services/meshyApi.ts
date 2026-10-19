// Meshy AI API Service
// Alternative to Tripo with free credits on signup

const MESHY_API_BASE = '/api/meshy';

export interface MeshyTask {
  id: string;
  type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  progress: number;
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
    usdz?: string;
    stl?: string;
  };
  thumbnail_url?: string;
  texture_urls?: Array<{
    base_color?: string;
    metallic?: string;
    normal?: string;
    roughness?: string;
  }>;
  consumed_credits?: number;
  task_error?: {
    message: string;
  };
}

export interface MeshyGenerationOptions {
  quality: 'draft' | 'standard' | 'high';
  autoTexture: boolean;
  aiModel?: string;
}

/**
 * Create an image-to-3D task on Meshy
 */
export async function createMeshyImageTo3DTask(
  apiKey: string,
  imageDataUrl: string,
  options: MeshyGenerationOptions
): Promise<string> {
  const body: Record<string, any> = {
    image_url: imageDataUrl,
    should_texture: options.autoTexture,
    enable_pbr: options.autoTexture,
  };

  // Set model based on quality
  if (options.quality === 'draft') {
    body.ai_model = options.aiModel || 'meshy-6-lite';
    body.should_remesh = false;
  } else if (options.quality === 'high') {
    body.ai_model = options.aiModel || 'meshy-7.1';
    body.geometry_resolution = '2k';
    body.should_remesh = true;
    body.target_polycount = 100000;
  } else {
    body.ai_model = options.aiModel || 'latest';
  }

  const response = await fetch(`${MESHY_API_BASE}/openapi/v1/image-to-3d`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meshy task creation failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.result;
}

/**
 * Get task status from Meshy
 */
export async function getMeshyTaskStatus(apiKey: string, taskId: string): Promise<MeshyTask> {
  const response = await fetch(`${MESHY_API_BASE}/openapi/v1/image-to-3d/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Meshy task status check failed (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Poll until the task is complete
 */
export async function pollMeshyTaskUntilComplete(
  apiKey: string,
  taskId: string,
  onProgress?: (progress: number, status: string) => void,
  intervalMs: number = 2000
): Promise<MeshyTask> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const task = await getMeshyTaskStatus(apiKey, taskId);
        
        if (onProgress) {
          onProgress(task.progress, task.status);
        }

        if (task.status === 'SUCCEEDED') {
          resolve(task);
        } else if (task.status === 'FAILED' || task.status === 'CANCELED') {
          const errorMsg = task.task_error?.message || 'Task failed';
          reject(new Error(`Meshy task ${task.status}: ${errorMsg}`));
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
 * Full pipeline for Meshy: create task → poll → return model URL
 */
export async function generate3DFromImageMeshy(
  apiKey: string,
  imageDataUrl: string,
  options: MeshyGenerationOptions,
  onProgress?: (progress: number, stage: string) => void
): Promise<{ modelUrl: string; thumbnailUrl?: string; taskId: string }> {
  // Step 1: Create task
  if (onProgress) onProgress(10, 'Starting Meshy 3D generation...');
  const taskId = await createMeshyImageTo3DTask(apiKey, imageDataUrl, options);
  
  // Step 2: Poll until complete
  if (onProgress) onProgress(15, 'Generating 3D model...');
  const task = await pollMeshyTaskUntilComplete(
    apiKey,
    taskId,
    (progress, status) => {
      if (onProgress) {
        const totalProgress = 15 + (progress * 0.8);
        onProgress(totalProgress, status === 'IN_PROGRESS' ? 'Generating 3D mesh & textures...' : 'Waiting in queue...');
      }
    }
  );
  
  // Step 3: Get model URL
  if (!task.model_urls?.glb) {
    throw new Error('Meshy generation succeeded but no GLB model URL was returned');
  }

  if (onProgress) onProgress(98, 'Model ready!');
  
  return {
    modelUrl: task.model_urls.glb,
    thumbnailUrl: task.thumbnail_url,
    taskId,
  };
}
