import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import MainLayout from "../../layouts/MainLayout";
import { useTranslation } from "../../utils/useTranslation";
import OraculumChoiceView from "../../components/Oracculum/OraculumChoiceView/OraculumChoiceView";


const OraculumChoice = () => {
  const { t } = useTranslation();
    const { user } = useAppContext();
    const navigate = useNavigate();

    const options = [
        {
            key: "payment",
            label: t("minerva_label"),
            description: t("minerva_description"),
            path: "/oraculum/minerva",
            icon: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmZjZ250eHMyMThkOXVua3gzY29oMzd4a3QxaG92dXo0amtyeDYxMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/tsYCcXey7FNqsxMgk3/giphy.gif",
            enabled: true,
        }, {
            key: "payment2",
            label:t("fidelex_label"),
            description:t("fidelex_description"),
            path: "/oraculum/fidelex",
            icon: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmh1N3licnhrNGg2NjNud25iaWZseDZzZHBmYjZ2cXp2enZsMHkzcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KQp2Me7jhg8ZG/giphy.gif",
            enabled: false,
        },
        {
            key: "compositus",
            label:t("compositus_label"),
            description:t("compositus_description"),
            path: "/oraculum/compositus",
            icon: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExOW1jemU5eG1hYm44N25hZ256M2FkZ3B0cDdsemg1eG5pd2QxajBjZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/IeLRF9uigqSbEkW2Ox/giphy.gif",
            enabled: true,
        },
        {
            key: "hr",
            label:t("hr_label"),
            description:t("hr_description"),
            path: "/oraculum/apis",
            icon: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDE3Zjlzb21xeTJrY3R5aG04aTc4MGxwN2YxNDZzaG96bGhua281biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/hvYaelBdwVvv7Gb3HL/giphy.gif",
            enabled: true,
        },
    ];

    const handleSelect = (path) => {
        navigate(path);
    };

    return (
        <MainLayout>
            <OraculumChoiceView
                user={user}
                options={options}
                onSelect={handleSelect}
            />
        </MainLayout>
    );
};

export default OraculumChoice;
