
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { useSession } from "../../../lib/auth-client";

import {
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";

import { DeliveryAddressSheet } from "../../cart/components/DeliveryAddressSheet";

import type {
  DeliveryAddress,
  ValidatedDeliveryAddress,
} from "../../cart/delivery/deliveryAddress.types";

// ============================================
// TIPOS
// ============================================

type ProfileTab = "profile" | "phone" | "address";

type CustomerProfile = {
  name: string;
  photo: string;
  phone: string;
  phoneVerified: boolean;
  address: DeliveryAddress | null;
};

type LegacyProfile = {
  name?: string;
  phone?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  reference?: string;
  latitude?: string;
  longitude?: string;
};

type ProfileContentProps = {
  userId: string;
  googleName: string;
  googleImage: string;
};

// ============================================
// ESTILOS
// ============================================

const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhone(value: string) {
  const number = digits(value).slice(0, 11);

  if (number.length <= 2) return number;

  if (number.length <= 7) {
    return number.replace(/^(\d{2})(\d)/, "($1) $2");
  }

  return number.replace(
    /^(\d{2})(\d{5})(\d{1,4})$/,
    "($1) $2-$3",
  );
}

function restoreAddress(
  value: unknown,
): DeliveryAddress | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<DeliveryAddress>;
  const coords = data.coordinates;

  if (
    !data.street ||
    !data.number ||
    !data.neighborhood ||
    !coords ||
    !Number.isFinite(coords.latitude) ||
    !Number.isFinite(coords.longitude)
  ) {
    return null;
  }

  return {
    street: data.street,
    number: data.number,
    neighborhood: data.neighborhood,
    complement: data.complement ?? "",
    city: "Rebouças",
    state: "PR",
    coordinates: {
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
  };
}

function migrateLegacyAddress(
  data: LegacyProfile,
): DeliveryAddress | null {
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);

  if (
    !data.street ||
    !data.number ||
    !data.neighborhood ||
    !data.latitude ||
    !data.longitude ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    street: data.street,
    number: data.number,
    neighborhood: data.neighborhood,
    complement:
      data.complement || data.reference || "",
    city: "Rebouças",
    state: "PR",
    coordinates: {
      latitude,
      longitude,
    },
  };
}

function loadCustomerProfile(
  userId: string,
  googleName: string,
): CustomerProfile {
  let saved: Partial<CustomerProfile> &
    LegacyProfile = {};

  try {
    const raw = localStorage.getItem(
      `customer-profile-demo:${userId}`,
    );

    if (raw) {
      saved = JSON.parse(raw);
    }
  } catch {
    // Mantém o perfil acessível.
  }

  return {
    name: saved.name?.trim() || googleName,
    photo:
      typeof saved.photo === "string"
        ? saved.photo
        : "",
    phone:
      typeof saved.phone === "string"
        ? formatPhone(saved.phone)
        : "",
    phoneVerified: false,
    address:
      restoreAddress(saved.address) ??
      migrateLegacyAddress(saved),
  };
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function CustomerDashboardProfile() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user?.id) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        Entre na sua conta para editar seu perfil.
      </div>
    );
  }

  return (
    <CustomerDashboardProfileContent
      key={user.id}
      userId={user.id}
      googleName={user.name ?? ""}
      googleImage={user.image ?? ""}
    />
  );
}

// ============================================
// CONTEÚDO
// ============================================

function CustomerDashboardProfileContent({
  userId,
  googleName,
  googleImage,
}: ProfileContentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] =
    useState<ProfileTab>("profile");

  const [profile, setProfile] =
    useState<CustomerProfile>(() =>
      loadCustomerProfile(userId, googleName),
    );

  const [mapOpen, setMapOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] =
    useState("");

  const [phoneMessage, setPhoneMessage] =
    useState("");
  const [saveMessage, setSaveMessage] =
    useState("");
  const [photoMessage, setPhotoMessage] =
    useState("");

  const displayPhoto = profile.photo || googleImage;

  // ==========================================
  // FOTO
  // ==========================================

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      )
    ) {
      setPhotoMessage(
        "Selecione uma imagem JPG, PNG ou WebP.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoMessage(
        "A foto deve ter no máximo 2 MB.",
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") return;

      setProfile((current) => ({
        ...current,
        photo: reader.result as string,
      }));

      setPhotoMessage(
        "Foto selecionada. Salve para confirmar.",
      );
      setSaveMessage("");
    };

    reader.onerror = () => {
      setPhotoMessage(
        "Não foi possível carregar a imagem.",
      );
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  // ==========================================
  // TELEFONE
  // ==========================================

  function handlePhoneChange(value: string) {
    setProfile((current) => ({
      ...current,
      phone: formatPhone(value),
      phoneVerified: false,
    }));

    setCodeSent(false);
    setVerificationCode("");
    setPhoneMessage("");
    setSaveMessage("");
  }

  function sendVerificationCode() {
    if (digits(profile.phone).length !== 11) {
      setPhoneMessage(
        "Informe um celular com DDD e 11 dígitos.",
      );
      return;
    }

    setCodeSent(true);
    setPhoneMessage(
      "Demonstração: utilize o código 123456. Nenhuma mensagem foi enviada.",
    );
  }

  function verifyPhone() {
    if (verificationCode !== "123456") {
      setPhoneMessage("Código incorreto.");
      return;
    }

    setProfile((current) => ({
      ...current,
      phoneVerified: true,
    }));

    setCodeSent(false);
    setVerificationCode("");

    setPhoneMessage(
      "Número validado apenas nesta demonstração.",
    );
    setSaveMessage("");
  }

  // ==========================================
  // ENDEREÇO
  // ==========================================

  function handleAddressConfirm(
    result: ValidatedDeliveryAddress,
  ) {
    setProfile((current) => ({
      ...current,
      address: result.address,
    }));

    setMapOpen(false);
    setSaveMessage(
      "Localização confirmada. Salve as alterações.",
    );
  }

  function handleComplementChange(value: string) {
    setProfile((current) => {
      if (!current.address) return current;

      return {
        ...current,
        address: {
          ...current.address,
          complement: value,
        },
      };
    });

    setSaveMessage("");
  }

  // ==========================================
  // SALVAR
  // ==========================================

  function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!profile.name.trim()) {
      setSaveMessage("Informe seu nome.");
      return;
    }

    if (
      profile.phone &&
      digits(profile.phone).length !== 11
    ) {
      setSaveMessage(
        "Informe um celular válido com DDD.",
      );
      return;
    }

    try {
      localStorage.setItem(
        `customer-profile-demo:${userId}`,
        JSON.stringify({
          ...profile,
          name: profile.name.trim(),
          phoneVerified: false,
        }),
      );

      setSaveMessage(
        "Alterações salvas neste navegador.",
      );
    } catch {
      setSaveMessage(
        "Não foi possível salvar as alterações.",
      );
    }
  }

  // ==========================================
  // NAVEGAÇÃO
  // ==========================================

  const tabs = [
    {
      id: "profile" as const,
      label: "Meu perfil",
      description: "Nome e foto",
      icon: UserRound,
      active:
        "border-indigo-300 bg-indigo-50 text-indigo-800 shadow-indigo-100",
      iconBg: "bg-indigo-100 text-indigo-700",
    },
    {
      id: "phone" as const,
      label: "Telefone",
      description: "WhatsApp",
      icon: Smartphone,
      active:
        "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-emerald-100",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "address" as const,
      label: "Endereço",
      description: "Localização",
      icon: MapPin,
      active:
        "border-sky-300 bg-sky-50 text-sky-800 shadow-sky-100",
      iconBg: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:h-full lg:gap-5">
      
{/* =====================================
    CABEÇALHO COMPACTO
===================================== */}

<section className="relative shrink-0 overflow-hidden rounded-2xl bg-[#20354b] px-5 py-4 text-white shadow-lg shadow-slate-900/10 sm:px-6">
  {/* EFEITO DECORATIVO */}

  <div className="pointer-events-none absolute -right-12 -top-20 size-48 rounded-full bg-sky-400/10 blur-2xl" />

  <div className="relative flex items-center gap-4">
    {/* ÍCONE */}

    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sky-200">
      <Settings2 size={21} />
    </div>

    {/* INFORMAÇÕES */}

    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-200">
        Minha conta
      </p>

      <h2 className="mt-0.5 text-lg font-black leading-tight sm:text-xl">
        Configurações do perfil
      </h2>

      <p className="mt-1 text-xs leading-relaxed text-slate-300">
        Gerencie seus dados, telefone e endereço.
      </p>
    </div>
  </div>
</section>


      {/* =====================================
          ABAS
      ===================================== */}

      <nav
        aria-label="Configurações do perfil"
        className="grid grid-cols-3 gap-2 sm:gap-3"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={
                selected ? "page" : undefined
              }
              onClick={() => {
                setActiveTab(tab.id);
                setSaveMessage("");
              }}
              className={`group flex min-w-0 flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all duration-200 sm:flex-row sm:p-4 sm:text-left ${
                selected
                  ? `${tab.active} shadow-md`
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                  selected
                    ? tab.iconBg
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon size={21} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold sm:text-sm">
                  {tab.label}
                </span>

                <span className="mt-0.5 hidden text-xs opacity-70 sm:block">
                  {tab.description}
                </span>
              </span>

              {selected && (
                <Check
                  size={16}
                  className="hidden shrink-0 sm:block"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* =====================================
          FORMULÁRIO
      ===================================== */}

      <form
  onSubmit={handleSave}
  className="flex min-h-0 flex-1 flex-col gap-3"
>
        {/* ===================================
            ABA PERFIL
        =================================== */}

        {activeTab === "profile" && (
          <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
            <div className="border-b border-indigo-100 bg-indigo-50/60 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <UserRound size={22} />
                </span>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Dados pessoais
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Sua identidade dentro do restaurante.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-7 p-5 sm:p-7">
              {/* FOTO */}

              <div className="flex flex-col items-center gap-5 rounded-2xl bg-slate-50 p-5 sm:flex-row">
                <div className="relative shrink-0">
                  <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-indigo-700 shadow-md">
                    {displayPhoto ? (
                      <img
                        src={displayPhoto}
                        alt="Foto do perfil"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={46} />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    aria-label="Alterar foto"
                    className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                  >
                    <Camera size={17} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                    aria-label="Selecionar foto"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-black text-slate-900">
                    Sua foto de perfil
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Utilizamos sua foto do Google
                    até você escolher outra.
                  </p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                    >
                      <ImagePlus size={16} />
                      Alterar foto
                    </button>

                    {profile.photo && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfile((current) => ({
                            ...current,
                            photo: "",
                          }));
                          setPhotoMessage("");
                          setSaveMessage("");
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        <X size={15} />
                        Usar foto Google
                      </button>
                    )}
                  </div>

                  <p
                    role="status"
                    className="mt-3 text-xs text-slate-400"
                  >
                    {photoMessage ||
                      "JPG, PNG ou WebP. Máximo de 2 MB."}
                  </p>
                </div>
              </div>

              {/* NOME */}

              <div className="max-w-xl">
                <label
                  htmlFor="profile-name"
                  className={labelClass}
                >
                  Nome completo
                </label>

                <input
                  id="profile-name"
                  required
                  maxLength={120}
                  autoComplete="name"
                  value={profile.name}
                  onChange={(event) => {
                    setProfile((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                    setSaveMessage("");
                  }}
                  placeholder="Seu nome completo"
                  className={inputClass}
                />

                <p className="mt-2 text-xs text-slate-400">
                  Este nome será utilizado para
                  identificar seus pedidos.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ===================================
            ABA TELEFONE
        =================================== */}

        {activeTab === "phone" && (
          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-100 bg-emerald-50/70 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Phone size={22} />
                </span>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Telefone e WhatsApp
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Receba atualizações sobre seus pedidos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <div className="max-w-2xl">
                <label
                  htmlFor="profile-phone"
                  className={labelClass}
                >
                  Número de celular com DDD
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="profile-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={profile.phone}
                    onChange={(event) =>
                      handlePhoneChange(
                        event.target.value,
                      )
                    }
                    placeholder="(42) 99999-9999"
                    className={inputClass}
                  />

                  {profile.phoneVerified ? (
                    <span className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-100 px-4 text-sm font-bold text-emerald-800">
                      <CheckCircle2 size={18} />
                      Validado (demo)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={sendVerificationCode}
                      className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700"
                    >
                      <ShieldCheck size={18} />
                      {codeSent
                        ? "Reenviar código"
                        : "Verificar"}
                    </button>
                  )}
                </div>

                {codeSent && (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <label
                      htmlFor="phone-code"
                      className={labelClass}
                    >
                      Código de verificação
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        id="phone-code"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(event) =>
                          setVerificationCode(
                            digits(
                              event.target.value,
                            ).slice(0, 6),
                          )
                        }
                        placeholder="6 dígitos"
                        className={inputClass}
                      />

                      <button
                        type="button"
                        onClick={verifyPhone}
                        className="min-h-12 rounded-xl bg-slate-800 px-5 text-sm font-bold text-white hover:bg-slate-900"
                      >
                        Confirmar código
                      </button>
                    </div>
                  </div>
                )}

                {phoneMessage && (
                  <p
                    role="status"
                    className="mt-3 text-sm text-emerald-800"
                  >
                    {phoneMessage}
                  </p>
                )}
              </div>

              {/* INFORMAÇÕES WHATSAPP */}

              <div className="rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-teal-50 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <MessageCircle size={23} />
                  </span>

                  <div>
                    <h4 className="font-black text-emerald-950">
                      Acompanhe seu pedido pelo WhatsApp
                    </h4>

                    <p className="mt-2 text-sm leading-relaxed text-emerald-900/75">
                      Este número será utilizado para
                      receber notificações automáticas
                      do Espetinhos João Paulo quando
                      seu pedido for confirmado,
                      estiver em preparo, ficar pronto
                      ou sair para entrega, após a
                      ativação desse serviço.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                A verificação por código ainda está
                em modo de demonstração. Nenhuma
                mensagem real é enviada nesta etapa.
              </p>
            </div>
          </section>
        )}

        {/* ===================================
            ABA ENDEREÇO
        =================================== */}

        {activeTab === "address" && (
          <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
            <div className="border-b border-sky-100 bg-sky-50/70 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <MapPin size={22} />
                </span>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Meu endereço
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Gerencie seu endereço de entrega.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              {profile.address ? (
                <>
                  {/* ENDEREÇO CADASTRADO */}

                  <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={19}
                        className="text-emerald-600"
                      />

                      <span className="text-sm font-bold text-emerald-800">
                        Localização confirmada
                      </span>
                    </div>

                    <h4 className="mt-4 text-lg font-black text-slate-900">
                      {profile.address.street},{" "}
                      {profile.address.number}
                    </h4>

                    <p className="mt-1 text-sm text-slate-600">
                      {profile.address.neighborhood}
                      {" — "}
                      Rebouças, PR
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-xs text-sky-700">
                      <Navigation size={15} />
                      Pino registrado no Google Maps
                    </div>
                  </div>

                  {/* COMPLEMENTO */}

                  <div>
                    <label
                      htmlFor="profile-complement"
                      className={labelClass}
                    >
                      Complemento ou ponto de referência
                      <span className="ml-1 font-normal text-slate-400">
                        (opcional)
                      </span>
                    </label>

                    <input
                      id="profile-complement"
                      value={
                        profile.address.complement
                      }
                      onChange={(event) =>
                        handleComplementChange(
                          event.target.value,
                        )
                      }
                      placeholder="Ex.: Casa azul, próximo ao mercado"
                      className={inputClass}
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Alterar este campo não modifica
                      a localização do pino.
                    </p>
                  </div>

                  {/* ALTERAR LOCALIZAÇÃO */}

                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700 sm:w-auto"
                  >
                    <MapPin size={18} />
                    Ver ou alterar localização
                    <ChevronRight size={17} />
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 p-7 text-center">
                    <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <MapPin size={29} />
                    </span>

                    <h4 className="mt-4 font-black text-slate-900">
                      Cadastre seu endereço
                    </h4>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                      Informe rua, número, bairro e
                      complemento e confirme no mapa
                      onde devemos entregar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700 sm:w-auto"
                  >
                    <MapPin size={18} />
                    Cadastrar endereço no mapa
                    <ChevronRight size={17} />
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {/* ===================================
            BOTÃO SALVAR
        =================================== */}

        <div className="mt-auto flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-medium text-slate-600"
          >
            {saveMessage ||
              "Salve suas alterações antes de sair."}
          </p>

          <button
            type="submit"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#20354b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#304d6a]"
          >
            <Save size={18} />
            Salvar alterações
          </button>
        </div>
      </form>

      {/* =====================================
          GOOGLE MAPS
      ===================================== */}

      <DeliveryAddressSheet
        open={mapOpen}
        initialAddress={profile.address}
        onClose={() => setMapOpen(false)}
        onConfirm={handleAddressConfirm}
      />
    </div>
  );
}
