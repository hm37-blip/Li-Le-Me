package com.lilema.controller.user;

import com.lilema.dto.ApiResponse;
import com.lilema.entity.po.User;
import com.lilema.service.AuthTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
public class AvatarController {
    private final AuthTokenService authTokenService;
    private final Path directory;

    public AvatarController(AuthTokenService authTokenService,
                            @Value("${app.avatar-directory:./uploads/avatars}") String directory) {
        this.authTokenService = authTokenService;
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestHeader(value = "Authorization", defaultValue = "") String authorization,
            @RequestParam("openid") String openid, @RequestParam("file") MultipartFile file) throws IOException {
        User user = authorization.startsWith("Bearer ")
                ? authTokenService.findUserByAccessToken(authorization.substring(7)) : null;
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, "请重新登录"));
        }
        if (!user.getOpenid().equals(openid)) {
            return ResponseEntity.status(403).body(ApiResponse.error(403, "无权上传该用户头像"));
        }
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "头像大小必须在 5MB 以内"));
        }
        // Validate image contents and dimensions before decoding; do not trust client filenames.
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(file.getBytes()))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(400, "请选择 PNG 或 JPG 图片"));
            }
            var reader = readers.next();
            try {
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("png") && !format.equalsIgnoreCase("jpeg")) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(400, "请选择 PNG 或 JPG 图片"));
                }
                reader.setInput(input);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || (long) width * height > 16000000) {
                    return ResponseEntity.badRequest().body(ApiResponse.error(400, "头像分辨率过大"));
                }
                var image = reader.read(0);
                Files.createDirectories(directory);
                String filename = UUID.randomUUID() + ".png";
                ImageIO.write(image, "png", directory.resolve(filename).toFile());
                return ResponseEntity.ok(ApiResponse.success(Map.of("avatar_url", "/uploads/avatars/" + filename)));
            } finally {
                reader.dispose();
            }
        }
    }
}
