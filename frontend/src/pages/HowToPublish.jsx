import { Link } from 'react-router-dom';

// One step in the guide: a numbered red circle badge + heading + description,
// matching the app's brand color. Kept as a small local component since the
// same shape repeats 10 times below.
function Step({ number, title, children }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
        {number}
      </span>
      <div className="pt-1">
        <h2 className="text-base font-semibold text-ink sm:text-lg">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-600 sm:text-base">{children}</p>
      </div>
    </li>
  );
}

export default function HowToPublish() {
  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-10">
      <Link to="/" className="inline-block text-sm font-medium text-primary hover:underline">
        &larr; මුල් පිටුවට
      </Link>

      <article className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          දැන්වීමක් පළ කරන්නේ කෙසේද?
        </h1>
        <p className="mt-2 text-base text-gray-600">How to publish your ad — step by step</p>

        <hr className="mt-6 border-border" />

        <p className="mt-6 rounded-lg border border-border bg-surface-muted p-4 text-base leading-relaxed text-gray-700 sm:p-5">
          ඔබගේ දැන්වීම AD SL Today හි පළ කිරීම ඉතා සරලයි. පහත පියවර 10 අනුගමනය කරන්න —
          පියවර කිහිපයකින් ඔබගේ දැන්වීම ප්‍රසිද්ධියේ පළ වේ.
        </p>

        <ol className="mt-8 space-y-7">
          <Step number={1} title="ගිණුමක් සාදන්න හෝ ලොග් වන්න">
            දැන්වීමක් පළ කිරීමට පළමුව ගිණුමක් අවශ්‍යයි. ඔබට ගිණුමක් නොමැති නම් "Register" ක්ලික්
            කර විනාඩියකින් ගිණුමක් සාදන්න, දැනටමත් ගිණුමක් තිබේ නම් "Login" කරන්න.
          </Step>

          <Step number={2} title='"Post an Ad" ක්ලික් කරන්න'>
            ලොග් වූ පසු, ඉහළ මෙනුවේ ඇති රතු පාට "Post an Ad" බොත්තම ක්ලික් කරන්න. එමගින්
            දැන්වීම් පළ කිරීමේ පියවර 5 ක ෆෝරමය විවෘත වේ.
          </Step>

          <Step number={3} title="මාතෘකාව සහ විස්තරය ලියන්න">
            ඔබ විකුණන දෙයට හෝ සේවාවට ගැලපෙන පැහැදිලි මාතෘකාවක් සහ සම්පූර්ණ විස්තරයක් ලියන්න.
            විස්තරය නිවැරදි හා අවංක විය යුතුය — එමගින් ගැනුම්කරුවන්ගේ විශ්වාසය ලබා ගත හැක.
          </Step>

          <Step number={4} title="කාණ්ඩය සහ සම්බන්ධතා තොරතුරු තෝරන්න">
            ඔබගේ දැන්වීමට ගැලපෙන කාණ්ඩය තෝරන්න, ගැනුම්කරුවන්ට ඔබව සම්බන්ධ කර ගැනීමට හැකි
            WhatsApp අංකය ඇතුළත් කරන්න. Telegram සහ නගරය සඳහන් කිරීම කැමැත්තෙන් සිදු කළ හැක.
          </Step>

          <Step number={5} title="ඡායාරූප උඩුගත කරන්න">
            දැන්වීමට ඡායාරූප තුනක් (3) දක්වා එකතු කළ හැක — එක් එක් ඡායාරූපය 400kb ට වඩා
            කුඩා විය යුතුය. හොඳ ඡායාරූප ඇති දැන්වීම් වලට වැඩි ප්‍රතිචාර ලැබේ.
          </Step>

          <Step number={6} title="දැන්වීම් මට්ටම තෝරන්න (Normal / Featured / Top Ad)">
            ඔබගේ දැන්වීම කොපමණ ප්‍රසිද්ධියක් ලබා දිය යුතුදැයි අනුව මට්ටමක් තෝරන්න — එක් එක්
            මට්ටමට වෙනස් මිලක් සහ දෘශ්‍යතාවක් ඇත. මිල Checkout පිටුවේ පැහැදිලිව පෙන්වනු ලැබේ.
          </Step>

          <Step number={7} title="සමාලෝචනය කර ඉදිරිපත් කරන්න">
            ඉදිරිපත් කිරීමට පෙර ඔබගේ දැන්වීමේ සියලු තොරතුරු නිවැරදිදැයි සමාලෝචනය කරන්න, පසුව
            "Submit Ad" ක්ලික් කරන්න.
          </Step>

          <Step number={8} title="බැංකු ගිණුමට මුදල් ට්‍රාන්ස්ෆර් කරන්න">
            ඔබව ස්වයංක්‍රීයව Checkout පිටුවට රැගෙන යනු ලැබේ. එහි බැංකු ගිණුම් විස්තර සහ
            ඔබගේ අනන්‍ය පරිශීලක කේතය (user code) පෙන්වනු ඇත. පෙන්වා ඇති ගිණුමට දැන්වීම් ගාස්තුව
            බැංකුවෙන් ට්‍රාන්ස්ෆර් කරන්න.
          </Step>

          <Step number={9} title="රිසිට් පත සහ කේතය WhatsApp හරහා එවන්න">
            ගෙවීම් රිසිට් පත සහ ඔබගේ පරිශීලක කේතය Checkout පිටුවේ ඇති "WhatsApp හරහා රිසිට් පත
            එවන්න" බොත්තම ක්ලික් කර අපගේ WhatsApp අංකයට එවන්න.
          </Step>

          <Step number={10} title="අනුමැතිය සඳහා රැඳී සිටින්න">
            අපගේ කණ්ඩායම ඔබගේ ගෙවීම තහවුරු කර දැන්වීම සමාලෝචනය කරනු ඇත. අනුමත වූ පසු, ඔබගේ
            දැන්වීම වෙබ් අඩවියේ ප්‍රසිද්ධියේ පළ වේ! ඔබගේ දැන්වීම්වල තත්ත්වය "My Dashboard" පිටුවෙන්
            ඕනෑම වේලාවක බැලිය හැක.
          </Step>
        </ol>

        <div className="mt-10 flex flex-col gap-3 rounded-lg border border-border bg-surface-muted p-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-sm text-gray-700">දැන් ඔබගේ පළමු දැන්වීම පළ කිරීමට සූදානම්ද?</p>
          <Link to="/post-ad" className="btn-primary shrink-0">
            දැන්වීමක් පළ කරන්න
          </Link>
        </div>
      </article>
    </div>
  );
}
