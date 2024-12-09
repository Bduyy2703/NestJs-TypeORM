import { AppDataSource } from "../src/cores/database/config/db.config";
import { User } from "../src/modules/users/entities/user.entity";

const startApp = async () => {
  try {
    // Kết nối database
    await AppDataSource.initialize();

    // Ví dụ thêm một user mới
    const userRepository = AppDataSource.getRepository(User);

    const newUser = userRepository.create({
      name: "John Doe",
      email: "johndoe@example.com"
    });

    await userRepository.save(newUser);

    console.log("User saved:", newUser);
  } catch (error) {
    console.error("Error starting app:", error);
  }
};

startApp();
