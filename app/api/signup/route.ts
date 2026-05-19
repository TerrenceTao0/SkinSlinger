import { prisma  } from "@/lib/db";
import bcrypt from "bcrypt";
import { containsSpecialChars } from "@/lib/utils";

//

export async function POST(request: Request) {
    try {
        const { username, password, email } = await request.json();

        if (!username || username.length < 3) {
            return Response.json({error: "Username too short"}, { status: 400 });
        }


        if (!password || password.length < 5) {
            return Response.json({error: "Password too short"}, { status: 400 });
        }


        if (containsSpecialChars(username)) {
            return Response.json({error: "Username contains special characters"}, { status: 400 })
        }


        if (!email) {
            return Response.json({error: "Email required"}, { status: 400 });
        }


        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            return Response.json({error: "Email already in use"}, { status: 409 });
        }


        const hashed_password = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashed_password,
                name: username,
            },
        });


        return Response.json({success: true, userId: user.id }, { status: 200 });

    } 
    catch (err) {
        console.error("Signup error:", err);

        return Response.json({ error: "Server error" }, { status: 500 });
    }
}

