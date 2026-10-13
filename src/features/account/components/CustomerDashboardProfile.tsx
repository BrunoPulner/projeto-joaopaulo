import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "../../../../src/lib/auth-client";
import {
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
type CustomerProfile = {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
  deliveryNotes: string;
  latitude: string;
  longitude: string;
};
const emptyProfile: CustomerProfile = {
  name: "",
  cpf: "",
  email: "",
  phone: "",
  phoneVerified: false,
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  reference: "",
  deliveryNotes: "",
  latitude: "",
  longitude: "",
};
const inputClass =
  "min-h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-700 focus:ring-2 focus:ring-orange-700/10";
const labelClass = "mb-2 block text-sm font-semibold text-stone-700";
function digits(value: string) {
  return value.replace(/\D/g, "");
}
function formatCpf(value: string) {
  return digits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function formatPhone(value: string) {
  const number = digits(value).slice(0, 11);
  if (number.length <= 2) return number;
  return number
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}
function formatZipCode(value: string) {
  return digits(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}
export function CustomerDashboardProfile() {
  const { data: session } = useSession();
  const googleUser = session?.user;
  const userId = googleUser?.id;
  const [profile, setProfile] = useState<CustomerProfile>({ ...emptyProfile });
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile({ ...emptyProfile });
      return;
    }
    let savedProfile: CustomerProfile = { ...emptyProfile };
    try {
      const saved = localStorage.getItem(`customer-profile-demo:${userId}`);
      if (saved) {
        savedProfile = { ...emptyProfile, ...JSON.parse(saved) };
      }
    } catch {
      // Se o armazenamento estiver indisponível, mantém os campos vazios.
    }
    setProfile({
      ...savedProfile,
      name: googleUser?.name ?? "",
      email: googleUser?.email ?? "",
    });
  }, [userId, googleUser?.name, googleUser?.email]);
  function updateField<K extends keyof CustomerProfile>(
    field: K,
    value: CustomerProfile[K],
  ) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaveMessage("");
  }
  function updateAddress(
    field:
      | "zipCode"
      | "street"
      | "number"
      | "neighborhood"
      | "city"
      | "state",
    value: string,
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
      latitude: "",
      longitude: "",
    }));
    setLocationMessage("");
    setSaveMessage("");
  }
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
      setPhoneMessage("Informe um celular com DDD e 11 dígitos.");
      return;
    }
    setCodeSent(true);
    setPhoneMessage(
      "Verificação de demonstração: utilize o código 123456.",
    );
  }
  function verifyPhone() {
    if (verificationCode !== "123456") {
      setPhoneMessage("Código incorreto. Para testar, utilize 123456.");
      return;
    }
    updateField("phoneVerified", true);
    setCodeSent(false);
    setVerificationCode("");
    setPhoneMessage("Telefone validado nesta demonstração.");
  }
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage(
        "Seu navegador não oferece acesso à localização.",
      );
      return;
    }
    setLocating(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setProfile((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setLocating(false);
        setSaveMessage("");
        setLocationMessage(
          "Localização obtida. Confira no mapa se corresponde ao endereço de entrega.",
        );
      },
      () => {
        setLocating(false);
        setLocationMessage(
          "Não foi possível obter sua localização. Confira a permissão do navegador.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      profile.cpf &&
      digits(profile.cpf).length !== 11
    ) {
      setSaveMessage("Confira o CPF: ele deve ter 11 dígitos.");
      return;
    }
    if (digits(profile.phone).length !== 11) {
      setSaveMessage("Confira o celular e inclua o DDD.");
      return;
    }
    try {
      if (!userId) {
        setSaveMessage("Sua sessão expirou. Entre novamente.");
        return;
      }
      localStorage.setItem(
        `customer-profile-demo:${userId}`,
        JSON.stringify({ ...profile, name: googleUser?.name ?? "", email: googleUser?.email ?? "" }),
      );
      setSaveMessage("Dados complementares salvos neste navegador.");
    } catch {
      setSaveMessage(
        "Não foi possível salvar. Confira as permissões de armazenamento do navegador.",
      );
    }
  }
  const addressQuery = [
    profile.street,
    profile.number,
    profile.neighborhood,
    profile.city,
    profile.state,
    profile.zipCode,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
  const hasCoordinates =
    profile.latitude !== "" && profile.longitude !== "";
  const canOpenMap =
    hasCoordinates || Boolean(profile.street && profile.city);
  const mapQuery = hasCoordinates
    ? `${profile.latitude},${profile.longitude}`
    : addressQuery;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    mapQuery,
  )}`;
  return (
    <div className="space-y-7">
      <section className="rounded-3xl bg-linear-to-br from-orange-700 to-orange-900 p-6 text-white shadow-lg shadow-orange-900/10 sm:p-8">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-100">
          <UserRound size={19} aria-hidden="true" />
          Minha conta
        </span>
        <h2 className="mt-3 text-2xl font-black sm:text-3xl">
          Seu perfil, do seu jeito.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-orange-50">
          Mantenha seus dados e endereço atualizados para facilitar
          seus próximos pedidos.
        </p>
      </section>
      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
              <UserRound size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Dados pessoais
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Informações para identificar sua conta.
              </p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="profile-name" className={labelClass}>
                Nome completo
              </label>
              <input
                id="profile-name"
                autoComplete="name"
                required
                value={profile.name}
                readOnly
                placeholder="Seu nome completo"
                className={`${inputClass} cursor-not-allowed bg-stone-50 text-stone-500`}
              />
            </div>
            <div>
              <label htmlFor="profile-cpf" className={labelClass}>
                CPF
              </label>
              <input
                id="profile-cpf"
                inputMode="numeric"
                value={profile.cpf}
                onChange={(event) =>
                  updateField("cpf", formatCpf(event.target.value))
                }
                placeholder="000.000.000-00"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-email" className={labelClass}>
                E-mail
              </label>
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                value={profile.email}
                readOnly
                placeholder="voce@exemplo.com"
                className={`${inputClass} cursor-not-allowed bg-stone-50 text-stone-500`}
              />
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Phone size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Telefone de contato
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Utilize o celular pelo qual podemos falar com você.
              </p>
            </div>
          </div>
          <label htmlFor="profile-phone" className={labelClass}>
            Celular com DDD
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="profile-phone"
              type="tel"
              autoComplete="tel-national"
              required
              value={profile.phone}
              onChange={(event) =>
                handlePhoneChange(event.target.value)
              }
              placeholder="(42) 99999-9999"
              className={inputClass}
            />
            {profile.phoneVerified ? (
              <span className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 text-sm font-bold text-emerald-800">
                <CheckCircle2 size={18} aria-hidden="true" />
                Validado na demonstração
              </span>
            ) : (
              <button
                type="button"
                onClick={sendVerificationCode}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 text-sm font-bold text-white transition hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
              >
                <ShieldCheck size={18} aria-hidden="true" />
                {codeSent ? "Reenviar código" : "Verificar telefone"}
              </button>
            )}
          </div>
          {codeSent && (
            <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
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
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(
                      digits(event.target.value).slice(0, 6),
                    )
                  }
                  placeholder="6 dígitos"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={verifyPhone}
                  className="min-h-12 shrink-0 rounded-xl bg-stone-900 px-5 text-sm font-bold text-white hover:bg-stone-800"
                >
                  Confirmar código
                </button>
              </div>
            </div>
          )}
          <p
            role="status"
            aria-live="polite"
            className="mt-3 text-sm text-stone-600"
          >
            {phoneMessage}
          </p>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <MapPin size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black text-stone-900">
                Endereço de entrega
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Cadastre o endereço que deseja usar nos seus pedidos.
              </p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-zip" className={labelClass}>
                CEP
              </label>
              <input
                id="profile-zip"
                autoComplete="postal-code"
                inputMode="numeric"
                value={profile.zipCode}
                onChange={(event) =>
                  updateAddress(
                    "zipCode",
                    formatZipCode(event.target.value),
                  )
                }
                placeholder="00000-000"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-neighborhood" className={labelClass}>
                Bairro
              </label>
              <input
                id="profile-neighborhood"
                value={profile.neighborhood}
                onChange={(event) =>
                  updateAddress("neighborhood", event.target.value)
                }
                placeholder="Seu bairro"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-street" className={labelClass}>
                Rua ou avenida
              </label>
              <input
                id="profile-street"
                autoComplete="address-line1"
                value={profile.street}
                onChange={(event) =>
                  updateAddress("street", event.target.value)
                }
                placeholder="Nome da rua"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-number" className={labelClass}>
                Número
              </label>
              <input
                id="profile-number"
                value={profile.number}
                onChange={(event) =>
                  updateAddress("number", event.target.value)
                }
                placeholder="Número ou S/N"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-city" className={labelClass}>
                Cidade
              </label>
              <input
                id="profile-city"
                autoComplete="address-level2"
                value={profile.city}
                onChange={(event) =>
                  updateAddress("city", event.target.value)
                }
                placeholder="Sua cidade"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-state" className={labelClass}>
                Estado
              </label>
              <input
                id="profile-state"
                autoComplete="address-level1"
                maxLength={2}
                value={profile.state}
                onChange={(event) =>
                  updateAddress(
                    "state",
                    event.target.value
                      .replace(/[^a-z]/gi, "")
                      .toUpperCase(),
                  )
                }
                placeholder="PR"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-complement" className={labelClass}>
                Complemento
              </label>
              <input
                id="profile-complement"
                autoComplete="address-line2"
                value={profile.complement}
                onChange={(event) =>
                  updateField("complement", event.target.value)
                }
                placeholder="Apartamento, bloco, casa..."
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-reference" className={labelClass}>
                Ponto de referência
              </label>
              <input
                id="profile-reference"
                value={profile.reference}
                onChange={(event) =>
                  updateField("reference", event.target.value)
                }
                placeholder="Próximo a..."
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="profile-notes" className={labelClass}>
                Orientações para a entrega
              </label>
              <textarea
                id="profile-notes"
                rows={3}
                value={profile.deliveryNotes}
                onChange={(event) =>
                  updateField("deliveryNotes", event.target.value)
                }
                placeholder="Ex.: tocar o interfone ou chamar no portão."
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
            <h3 className="font-bold text-stone-900">
              Localização no mapa
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Use sua localização atual quando estiver no endereço de
              entrega. Você também pode conferir o endereço preenchido
              no Google Maps.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60"
              >
                <Navigation size={17} aria-hidden="true" />
                {locating
                  ? "Obtendo localização..."
                  : "Usar localização atual"}
              </button>
              {canOpenMap && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-800 hover:bg-sky-50"
                >
                  <MapPin size={17} aria-hidden="true" />
                  Conferir no Google Maps
                </a>
              )}
            </div>
            {hasCoordinates && (
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={17} aria-hidden="true" />
                Localização vinculada ao endereço
              </p>
            )}
            <p
              role="status"
              aria-live="polite"
              className="mt-3 text-sm text-stone-600"
            >
              {locationMessage}
            </p>
          </div>
        </section>
        <div className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-medium text-stone-700"
          >
            {saveMessage || "Salve suas alterações antes de sair desta tela."}
          </p>
          <button
            type="submit"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
          >
            <Save size={18} aria-hidden="true" />
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}
