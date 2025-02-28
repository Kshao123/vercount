import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// 创建 Gist（增）
async function createGist(files, description = 'Automated Gist', isPublic = false) {
	const response = await octokit.gists.create({
		description,
		public: isPublic,
		files: Object.fromEntries(
			Object.entries(files).map(([filename, content]) => [
				filename,
				{ content: typeof content === 'string' ? content : JSON.stringify(content) }
			])
		)
	});
	return response.data;
}

// 获取 Gist 详情（查）
async function getGist(gistId) {
	try {
		const response = await octokit.gists.get({ gist_id: gistId });
		return response.data;
	} catch (error) {
		if (error.status === 404) return null;
		throw error;
	}
}

// 更新 Gist（改）
async function updateGist(gistId, filesUpdate) {
	const response = await octokit.gists.update({
		gist_id: gistId,
		files: filesUpdate
	});
	return response.data;
}

export async function syncToGist(gistId, localFiles, options = {}) {
  const {
    deleteOrphaned = true, // 是否删除 Gist 中存在但本地不存在的文件
    description = "Synced Gist",
    isPublic = false,
  } = options;

  // 读取本地文件
  const fileContents = {};
  for (const filePath of Object.keys(localFiles)) {
    let content;
		// 兼容读取 File 和 直接的内容
		const fileContent = localFiles[filePath];
		if (typeof fileContent === 'string') {
			content = fs.readFileSync(path.resolve(localFiles[filePath]), "utf8");
		} else {
			content = JSON.stringify(fileContent);
		}
		
    fileContents[filePath] = content;
  }

  // 检查 Gist 是否存在
  let gist = await getGist(gistId);
  const filesUpdate = {};

  if (!gist) {
    // 创建新 Gist
    gist = await createGist(fileContents, description, isPublic);
    console.log(`Created new Gist: ${gist.html_url}`);
    return gist;
  }

  // 准备更新内容
  Object.entries(fileContents).forEach(([filename, content]) => {
    const existingFile = gist.files[filename];
    if (!existingFile || existingFile.content !== content) {
      filesUpdate[filename] = { content };
    }
  });

  // 处理需要删除的文件
  if (deleteOrphaned) {
    Object.keys(gist.files).forEach((filename) => {
      if (!(filename in fileContents)) {
        filesUpdate[filename] = null;
      }
    });
  }

  // 执行更新
  if (Object.keys(filesUpdate).length > 0) {
    await updateGist(gistId, filesUpdate);
    console.log(`Successfully updated Gist: ${gist.html_url}`);
  } else {
    console.log("Gist is already up-to-date");
  }

  return await getGist(gistId);
}

// 示例配置
// const config = {
// 	GIST_ID: 'b3f461eb23fa0bebbc56b6f76062ef70', // 设为 null 自动创建
// 	FILES: {
// 		'counts.json': './files/counts.json',
// 		'sitemap.xml': './files/sitemap.xml'
// 	},
// 	OPTIONS: {
// 		deleteOrphaned: true,
// 		description: 'site uv sync',
// 		isPublic: false
// 	}
// };

// 执行同步
// (async () => {
// 	try {
// 		const result = await syncToGist(
// 			config.GIST_ID,
// 			config.FILES,
// 			config.OPTIONS
// 		);
// 		console.log('Sync result:', result.html_url);
// 	} catch (error) {
// 		console.error('Sync failed:', error);
// 	}
// })();
