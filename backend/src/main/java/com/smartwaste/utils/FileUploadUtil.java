package com.smartwaste.utils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.web.multipart.MultipartFile;

public final class FileUploadUtil {

	private FileUploadUtil() {
	}

	public static String saveFile(String uploadDir, MultipartFile file) throws IOException {
		Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
		File dir = basePath.toFile();
		if (!dir.exists() && !dir.mkdirs()) {
			throw new IOException("Could not create directory " + basePath);
		}

		String cleanFileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
		File destination = new File(dir, cleanFileName);
		file.transferTo(destination);
		return destination.getAbsolutePath();
	}
}


